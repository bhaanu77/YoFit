module.exports = function(router, mongoose, auth, graph){

  var gcm = require('node-gcm');
  var config = require('../config')
  var moment = require('moment');
  var Activity = require('../models/activity');
  var User = require('../models/User');
  var request = require('request');
 

  var sender = new gcm.Sender(config.gcm);
  var message = new gcm.Message();


  //This route creates a new calendar event for testing
  router.route('/resp')
  .post(function(req, res) {
    // Get an access token for the app.
    auth.getAccessToken().then(function (token) {
      // Get all of the users in the tenant.
      graph.getUsers(token)
      .then(function (users) {
          
        var user;
        if( users[0].mail==req.body.mail)
          user = users[0];
        else if (users[1].mail==req.body.mail){
          user = users[1];
        }  
          // Create an event on each user's calendar.
          //graph.createEvent(token, users[0]);
          createCalEvent(token, user);
          
          res.send('POST request to the homepage'+users[0].mail+users[1].mail);
        }, function (error) {
          console.error('>>> Error getting users: ' + error);
        });
    }, function (error) {
      console.error('>>> Error getting access token: ' + error);
    }
  );
  
  
  }); 


/*
  Returns a boolean value whether the user CAN take a break
  This depends on whether the user recently took a break or whether they have
  upcoming meetings
*/
/*
function canUserTakeBreak(listOfEvents){
  var currentDate = moment().utc();

    for(var i =0; i<listOfEvents.length;i++){
        var start = moment(listOfEvents[i].start.dateTime).utc()
        var end  = moment(listOfEvents[i].end.dateTime).utc()

        var differenceBetweenStartAndCurrent = Math.abs(start.diff(currentDate, 'minutes'));

        //Only if the scheduled meeting is not
        if (moment(currentDate).isBetween(start, end) || differenceBetweenStartAndCurrent <= 20){
          //Add additional logic here!!
          return false;
        }
    }
    return true;
  }

  graph.pushNotification = function(response, chromeId){
    var message = new gcm.Message();
    message.addData({
      activity: response.activity,
      name: response.name,
    });
    // the chromeID is equal the registrationID 
    // the registration_id is used by gcm to uniquely identify every single chromebrowser extension 
    sender.send(message, { registrationTokens: [chromeId] }, function (err, response) {
        if(err) console.error(err);
        else    console.log(response);
    });
  }
  */
  //module.exports = graph;

// @name createEvent
// @desc Creates an event on each user's calendar.
// @param token The app's access token.
// @param users An array of users in the tenant.
function createCalEvent(token, user) {
   console.error('>>> Entered createCalEvent function');
    // The new event will be 10 minutes and take place today at the current time.
    var startTime = new Date();
    startTime.setDate(startTime.getDate());
    var endTime = new Date(startTime.getTime() + 10 * 60000);
    // we are using todays date . 
    
    // These are the fields of the new calendar event.
    var newEvent = {
      Subject: 'Healthy Break Time',
      Location: {
        DisplayName: "Not at desk ;-)"
      },
      Start: {
        'DateTime': startTime,
        'TimeZone': 'PST'
      },
      End: {
        'DateTime': endTime,
        'TimeZone': 'PST'
      },
      "ShowAs":"Oof",
      Body: {
        Content: '<html> <head></head> <body>Go for a brisk walk <img src="http://thumbs.dreamstime.com/z/business-man-suit-walking-beach-13321410.jpg" height="70" width="42" </body> </html>',
        ContentType: 'HTML'
      }
    };


    // Add an event to the current user's calendar.
    request.post({
      url: 'https://graph.microsoft.com/v1.0/users/' + user.id + '/events',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + token,
        'displayName': user.displayName
      },
      body: JSON.stringify(newEvent)
    }, function (err, response, body) {
      console.error('>>> Entered callback of Pst to graph');
      if (err) {
        console.error('>>> Application error: ' + err);
      } else {
        var parsedBody = JSON.parse(body);
        var displayName = response.request.headers.displayName;

        if (parsedBody.error) {
          if (parsedBody.error.code === 'RequestBroker-ParseUri') {
            console.error('>>> Error creating an event for ' + displayName  + '. Most likely due to this user having a MSA instead of an Office 365 account.');
          } else {
            console.error('>>> Error creating an event for ' + displayName  + '.' + parsedBody.error.message);
          }
        } else {
          console.log('>>> Successfully created an event on ' + displayName + "'s calendar.");
        }
      }
    });

}; 

 module.export = createCalEvent ;
};
