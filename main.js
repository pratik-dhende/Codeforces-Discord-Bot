const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();

client.once("ready", () => {
    console.log("CP is online");
})

client.on("message", message =>{
    if (message.content.toLowerCase().trim() === `${config.prefix}upC`.toLowerCase()){
        showUpcomingContests(message);
    }
    if (message.content.toLowerCase().trim() === `${config.prefix}nC`.toLowerCase()){
        showNextContest(message);
    }
})

client.login(config.token)

// --------------------------------------------------------------------------------------------------------------------------------------------------

const crypto = require('crypto');
const fetch = require("node-fetch");

const key = "c1c67207d23066b0da76dccd1d52c3a363692c51";
const secret = "934f04a61910669e118c734b62bb4d59e58a9911";
const defaultURL = "https://codeforces.com/api/";

function stringifyParams(params){
    let strParams = "";

    for(let key in params){
        strParams += (`${key}=${params[key]}&`)
    }

    return strParams.slice(0, -1);
}

function stringifyDate(date){
    let timeStr = date.getHours() + ':' + ('0' + date.getMinutes()).substr(-2) + ':' + ('0' + date.getSeconds()).substr(-2);
    let weekDay = date.toLocaleString("en-US", {weekday: "long"});
    let month = date.toLocaleString("en-US", {month: "long"});
    let day = date.toLocaleString("en-US", {day: "numeric"});

    return {
        timeStr: timeStr,
        weekDay: weekDay,
        month: month,
        day: day
    }
}

function generatePrivateRequest(methodName, params, key, secret){
    // const currTime = (Math.round((new Date()).getTime() / 1000)).toString();
    methodName += '?';

    const rand = (Math.floor(100000 + Math.random() * 900000)).toString();

    const strParams = stringifyParams(params);

    const hashInput = rand + '/' + methodName + strParams + '#' + secret;
    const hash = crypto.createHash('sha512').update(hashInput).digest('hex');

    const sig = "apiSig=" + rand + hash;
    
    return defaultURL + methodName + strParams + '&' + sig;
}

function generatePublicRequest(methodName, params){
    methodName += '?';
    return defaultURL + methodName + stringifyParams(params);
}

async function fetchPublicData(url){
    try{
        const res = await fetch(url);
        const data = await res.json();

        return data;
    }
    catch(err){
        return null;
    }
}

async function updateUpcomingContests(){
    const methodName = "contest.list";
    const params = {
        gym: false
    }
    const url = await generatePublicRequest("contest.list", params);

    const data = await fetchPublicData(url);

    upcomingContests = []

    if (data){
        if (data.result.length != 0){
            for(let contest of (data.result)){
                if (contest.phase === "BEFORE"){
                    upcomingContests.push(contest);
                }
            }
        }
    }

    return upcomingContests;
}

async function showUpcomingContests(message){
    upcomingContests = await updateUpcomingContests();

    if (upcomingContests.length != 0){
        for(contest of upcomingContests){
            if (contest.phase === "BEFORE"){
                console.log(contest);

                timeParams = stringifyDate(new Date(contest.startTimeSeconds * 1000));
                botResponse = `${contest.name} on ${timeParams.weekDay}, ${timeParams.day} ${timeParams.month} at ${timeParams.timeStr}.`;

                console.log(botResponse);
                message.channel.send(botResponse);               
            }
            else{
                message.channel.send("No upcoming contest. :(");
            }
        }

    }
    else{
        message.channel.send("Website is down!.\nTry again later.")
    }
}

async function showNextContest(message){
    upcomingContests = (await updateUpcomingContests());

    if (upcomingContests.length != 0){
        let contest = null;

        for(let upc of upcomingContests){
            contest = upc;
        }

        console.log(contest);

        timeParams = stringifyDate(new Date(contest.startTimeSeconds * 1000));
        botResponse = `${contest.name} on ${timeParams.weekDay}, ${timeParams.day} ${timeParams.month} at ${timeParams.timeStr}.`;

        console.log(botResponse);
        message.channel.send(botResponse); 
    }
    else{
        message.channel.send("Website is down!.\nTry again later.")
    }
}

// ---------------------------------------------------------------------------------------------

