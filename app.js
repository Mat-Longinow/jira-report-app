require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = 3080;
const jiraData = require('./jira.js');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

app.use(express.static( 'views'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

let teams = [
    {
        team_name: 'BEA',
        team_logo: '/img/bea-logo.png',
        team_lead: 'Jacob Smith',
        developer_1: 'Nick Delja',
        developer_2: 'Nick Vander Kolk',
        developer_4: 'Daniel Riley'
    },
    {
        team_name: 'CPO',
        team_logo: '/img/cpo-logo.png',
        team_lead: 'Alex Sherry',
        developer_1: 'Brandon Arbini'
    },
    {
        team_name: 'DBNew',
        team_logo: '/img/dbnew-logo.png',
        team_lead: 'Jordan Colburn',
        developer_1: 'Luke Scott',
        developer_2: 'Kevin Kishiyama'
    },
    {
        team_name: 'FW',
        team_logo: '/img/fw-logo.png',
        team_lead: 'Nathan Scott',
        developer_1: '& Friends'
    }
];

let reportInfo = {
    team: '',
    sprint: '',
    last_sprint: '',
    two_sprints: '',
    start_date: '',
    end_date: '',
    sp_expected: '',
    issues_expected: '',
    vel_avg: '',
    sprints_left: '',
    sp_remaining: ''
};

exports.teams = teams;

app.get('/report', (req, res) => {
    console.log('report endpoint hit');

    res.render('report',
        {
            team: reportInfo.team,
            teams: teams,
            name: jiraData.jiraReport.name,
            start_date: jiraData.jiraReport.start_date,
            end_date: jiraData.jiraReport.end_date,
            sp_expected: reportInfo.sp_expected,
            sp_actual: jiraData.jiraReport.sp_actual,
            issues_expected: reportInfo.issues_expected,
            issues_actual: jiraData.jiraReport.issues_actual,
            sp_roll: jiraData.jiraReport.sp_roll,
            issues_roll: jiraData.jiraReport.issues_roll,
            sp_added: jiraData.jiraReport.sp_added,
            vel_avg: reportInfo.vel_avg,
            sprints_left: reportInfo.sprints_left,
            issues: jiraData.jiraReport.issues,
            rolled_issues: jiraData.jiraReport.rolled_issues,
            new_issues: jiraData.jiraReport.new_issues,
        });
});

app.post('/details', (req, res) => {
    console.log('/details endpoint hit');

    reportInfo = {
        ...reportInfo,
        team: req.body.team,
        sprint: req.body.sprint_number,
        last_sprint: req.body.last_sprint,
        two_sprints:req.body.two_sprints,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        sp_expected: req.body.sp_expected,
        issues_expected: req.body.issues_expected,
        sp_remaining: req.body.sp_remaining,
        next_sprint: req.body.next_sprint
    };

    exports.reportInfo = reportInfo;

    jiraData.jiraData();
});

app.get('/', (req, res) => {
    res.render('index', {teams: teams})
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));