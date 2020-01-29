const request = require('request');
require('dotenv').config();
const app = require('./app.js');

exports.jiraData = () => {
  console.log('jira.js initiated');

  // import in reportInfo from app.js in order to bring in form results
  let reportInfo = app.reportInfo;

  // Set dates to take out the first day and last day of a sprint to factor in likely sprint planning (which we don't want to track)
  let start_date = new Date(app.reportInfo.start_date);
  let math_start_date = start_date.getDate() + 1;
  let adjusted_start_date = start_date.setDate(math_start_date);

  let end_date = new Date(app.reportInfo.end_date);
  let math_end_date = end_date.getDate() - 1;
  let adjusted_end_date = end_date.setDate(math_end_date);


  let jiraReport = {
    name: '',
    start_date: '',
    end_date: '',
    sp_actual: '',
    sp_last_sprint: '',
    sp_two_sprints: '',
    issues_actual: '',
    sp_roll: '',
    issues_roll: '',
    sp_added: '',
    vel_avg: '',
    sprints_left: '',
    issues: [],
    rolled_issues: [],
    new_issues: []
  };

  let options = (url) => {
    let options = {
      method: 'GET',
      url: url,
      auth: {
        username: process.env.EMAIL,
        password: process.env.APITOKEN,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    return options;
  };

  // Jira REST API GET request URL's
  const sprintDetailsUrl = 'https://webconnex.atlassian.net/rest/agile/1.0/sprint/' + reportInfo.sprint;
  const rollUrl = 'https://webconnex.atlassian.net/rest/api/2/search?jql=sprint%20%3D%20' + reportInfo.sprint + '%20AND%20sprint%20%3D%20' + reportInfo.last_sprint + '%20AND%20type%20!%3D%20epic';
  const doneUrl = 'https://webconnex.atlassian.net/rest/api/2/search?jql=project%20%3D%20%22' + reportInfo.team + '%22%20AND%20status%20%3D%20Done%20AND%20sprint%20%3D%20' + reportInfo.sprint + '%20AND%20sprint%20!%3D%20' + reportInfo.next_sprint;
  const newUrl = 'https://webconnex.atlassian.net/rest/api/2/search?jql=project%20%3D%20%22' + reportInfo.team + '%22%20AND%20created%20%3E%3D%20' + adjusted_start_date +'%20AND%20created%20%3C%3D%20' + adjusted_end_date;
  const lastSprintUrl = 'https://webconnex.atlassian.net/rest/api/2/search?jql=project%20%3D%20%22' + reportInfo.team + '%22%20AND%20status%20%3D%20Done%20AND%20sprint%20%3D%20' + reportInfo.last_sprint + '%20AND%20sprint%20!%3D%20' + reportInfo.sprint;
  const twoSprintsUrl = 'https://webconnex.atlassian.net/rest/api/2/search?jql=project%20%3D%20%22' + reportInfo.team + '%22%20AND%20status%20%3D%20Done%20AND%20sprint%20%3D%20' + reportInfo.two_sprints + '%20AND%20sprint%20!%3D%20' + reportInfo.last_sprint;

  (async () => {
    let sprintDetails = () => {
      return new Promise((resolve, reject) => {
        let dataBody;

        request(options(sprintDetailsUrl), (error, response, body) => {
          if (error) throw new Error(error);
          console.log(
              'Sprint Details Response: ' + response.statusCode + ' ' + response.statusMessage
          );
          dataBody = JSON.parse(body);

          jiraReport.name = dataBody.name;

          resolve();
        });
      });
    };

    let doneReq = () => {
      return new Promise((resolve, reject) => {
        let dataBody;

        request(options(doneUrl), (error, response, body) => {
          if (error) throw new Error(error);
          console.log(
              'Done Response: ' + response.statusCode + ' ' + response.statusMessage
          );
          dataBody = JSON.parse(body);

          // Combine all the Story Points and put it into the jiraReport
          let storyPointsTotal = 0;
          dataBody.issues.forEach((element) => {
            storyPointsTotal += element.fields.customfield_10043;
          });
          jiraReport.sp_actual = storyPointsTotal;

          // Pulls all the issue names and puts it into the array in jiraReport
          // Makes sure that a null doesn't get returned or if no data is present, it shows as Unassigned
          dataBody.issues.forEach((element) => {
            let display_name = 'Unassigned';
            let story_points = 'Unassigned';

            if (element.fields.assignee) {
              display_name = element.fields.assignee.displayName
            }

            if (element.fields.customfield_10043) {
              story_points = element.fields.customfield_10043
            }


            jiraReport.issues.push({
              issue_id: element.key,
              name: element.fields.summary,
              story_points: story_points,
              assignee: display_name,
            });
          });

          jiraReport.issues_actual = jiraReport.issues.length;

          resolve();
        });
      });
    };

    let rollReq = () => {
      return new Promise((resolve, reject) => {
        let dataBody;

        request(options(rollUrl), (error, response, body) => {
          if (error) throw new Error(error);
          console.log(
              'Roll Response: ' + response.statusCode + ' ' + response.statusMessage
          );
          dataBody = JSON.parse(body);

          jiraReport.issues_roll = dataBody.total;

          // Gather all the titles of the issues and put them into jiraReport
          // Makes sure that a null doesn't get returned or if no data is present, it shows as Unassigned
          dataBody.issues.forEach((element) => {
            let display_name = 'Unassigned';
            let story_points = 'Unassigned';

            if (element.fields.assignee) {
              display_name = element.fields.assignee.displayName
            }

            if (element.fields.customfield_10043) {
              story_points = element.fields.customfield_10043
            }

            jiraReport.rolled_issues.push({
              issue_id: element.key,
              name: element.fields.summary,
              assignee: display_name,
              story_points: story_points,
              status: element.fields.status.name
            });
          });

          // Combine all the Story Points and put it into the jiraReport
          let storyPointsTotal = 0;
          dataBody.issues.forEach((element) => {
            storyPointsTotal += element.fields.customfield_10043;
          });
          jiraReport.sp_roll = storyPointsTotal;

          resolve();
        });
      });
    };

    let newReq = () => {
      return new Promise((resolve, reject) => {
        let dataBody;

        request(options(newUrl), (error, response, body) => {
          if (error) throw new Error(error);
          console.log(
              'New Response: ' + response.statusCode + ' ' + response.statusMessage
          );
          dataBody = JSON.parse(body);

          // Gather all the titles of the issues and put them into jiraReport
          dataBody.issues.forEach((element) => {
            let story_points = 'Unassigned';

            if (element.fields.customfield_10043) {
              story_points = element.fields.customfield_10043
            }

            jiraReport.new_issues.push({
              issue_id: element.key,
              name: element.fields.summary,
              story_points: story_points,
            });
          });

          // Combine all the Story Points and put it into the jiraReport
          let storyPointsTotal = 0;
          dataBody.issues.forEach((element) => {
            storyPointsTotal += element.fields.customfield_10043;
          });
          jiraReport.sp_added = storyPointsTotal;

          resolve();
        });
      });
    };

    let lastSprintReq = () => {
      return new Promise((resolve, reject) => {
        let dataBody;

        request(options(lastSprintUrl), (error, response, body) => {
          if (error) throw new Error(error);
          console.log(
              'Last Sprint Response: ' + response.statusCode + ' ' + response.statusMessage
          );
          dataBody = JSON.parse(body);

          // Combine all the Story Points and put it into the jiraReport
          let storyPointsTotal = 0;
          dataBody.issues.forEach((element) => {
            storyPointsTotal += element.fields.customfield_10043;
          });
          jiraReport.sp_last_sprint = storyPointsTotal;

          resolve();
        });
      });
    };

    let twoSprintsReq = () => {
      return new Promise((resolve, reject) => {
        let dataBody;

        request(options(twoSprintsUrl), (error, response, body) => {
          if (error) throw new Error(error);
          console.log(
              'Two Sprints Response: ' + response.statusCode + ' ' + response.statusMessage
          );
          dataBody = JSON.parse(body);

          // Combine all the Story Points and put it into the jiraReport
          let storyPointsTotal = 0;
          dataBody.issues.forEach((element) => {
            storyPointsTotal += element.fields.customfield_10043;
          });
          jiraReport.sp_two_sprints = storyPointsTotal;

          resolve();
        });
      });
    };

    await sprintDetails();
    await rollReq();
    await doneReq();
    await newReq();
    await lastSprintReq();
    await twoSprintsReq();

    // Estimate Sprints Left & Avg Velocity Math
    let set_sprints_left = () => {
      if (reportInfo.sp_remaining !== '' && reportInfo.sp_remaining !== '--') {
        app.reportInfo.sprints_left = Math.round((reportInfo.sp_remaining / reportInfo.vel_avg) * 10) / 10;
      } else {
        app.reportInfo.sprints_left = '--';
      }
    };

    let set_velocity_avg = () => {
      app.reportInfo.vel_avg = Math.round((jiraReport.sp_actual + jiraReport.sp_last_sprint + jiraReport.sp_two_sprints) / 3);
    };

    set_velocity_avg();
    set_sprints_left();

    let changeDateFormat = () => {
      let options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      };

      jiraReport.start_date = new Date(app.reportInfo.start_date).toLocaleDateString('en-US', options);
      jiraReport.end_date = new Date(app.reportInfo.end_date).toLocaleDateString('en-US', options);
    };

    changeDateFormat();

    exports.jiraReport = jiraReport;
  })();
};