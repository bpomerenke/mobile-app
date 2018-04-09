import { Injectable } from "@angular/core";
import { Http, Headers } from "@angular/http";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { Observable } from "rxjs/Observable";
import 'rxjs/add/operator/map';
//import 'rxjs/add/operator/toPromise';
//import 'rxjs/add/operator/catch';

@Injectable()
export class Meetup {
    accessToken: any;
    clientId: any;
    redirectURI: any;
    url: any;
    browserClientId: any;
    browserRedirectURI: any;
    browserUrl: any;
    baseUrl: string;

    constructor(public http: Http, public iab: InAppBrowser) {
        //OAuth
        this.clientId = 'mabrcd406k0hhhe6gms84lfaq0';
        this.redirectURI = 'http://localhost';
        this.url = 'https://secure.meetup.com/oauth2/authorize?scope=rsvp&client_id=' + this.clientId + '&response_type=token&redirect_uri=' + this.redirectURI;

        //Need these for running locally with only a web browser on port 8100
        this.browserClientId = 'c6rhrufurnhhfl3e7nirenh9nl';
        this.browserRedirectURI = 'http://localhost:8100';
        this.browserUrl = 'https://secure.meetup.com/oauth2/authorize?scope=rsvp&client_id=' + this.browserClientId + '&response_type=token&redirect_uri=' + this.browserRedirectURI;

        this.baseUrl = 'https://api.meetup.com';
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    getUserInfo() {
        let headers = new Headers();

        headers.append('Authorization', 'Bearer ' + this.accessToken);
        headers.append('Content-Type', 'application/json');
        return this.http.get(`${this.baseUrl}/2/member/self/`, { headers: headers }).map(res => res.json());
    }

    getCurrentUserInfo(){
        let headers = new Headers();
        let memberV3Url = `${this.baseUrl}/members/self/?access_token=${this.accessToken}`;
        return this.http.get(memberV3Url, { headers: headers }).toPromise();        
    }

    rsvp(eventId, response){
        let headers = new Headers();
        let rsvpV3Url = `${this.baseUrl}/SGF-Web-Devs/events/${eventId}/rsvps?response=${response}&access_token=${this.accessToken}`;

        let payload = { response }
        return this.http.post(rsvpV3Url, payload, {headers: headers}).map(res => {
            return res;
        });
    }
    checkRSVP(eventId, userId){
        let headers = new Headers();
        let rsvpV3Url = `${this.baseUrl}/SGF-Web-Devs/events/${eventId}/rsvps?&access_token=${this.accessToken}`;
        console.log('checking rsvp for ', eventId);
        return this.http.get(rsvpV3Url, {headers: headers}).map(res => {
            let rsvps = res.json();
            for(let rsvp of rsvps){
                if(rsvp.member.id === userId){
                    return true;
                }
            }
            return false;
        });
    }
    getLatestEvent(){
        let headers = new Headers();
        let eventsV3Url = `${this.baseUrl}/SGF-Web-Devs/events?scroll=recent_past&access_token=${this.accessToken}`;
        return this.http.get(eventsV3Url, {headers: headers}).map(res => {
            let events = res.json();
            console.log('events:', events);
            for(let event of events){
                if(event.status != 'past'){
                    return event;
                }
            }
            
            return events[0];
        });
    }

    browserTokenOverride(token: string){
        return new Promise((resolve,reject) => {
            if(token && token.length > 0){
                this.accessToken = token;
                resolve();     
            } else {
                reject('invalid token');
            }
        });
    }

    browserLogin(){
        this.iab.create(this.browserUrl, '_blank');
    }

    login() {
        return new Promise((resolve, reject) => {

            let browser = this.iab.create(this.url, '_blank');

            let listener = browser.on('loadstart').subscribe((event: any) => {

                if (event.url.indexOf('login') > -1) {
                    return;
                }

                if (event.url.indexOf('https://facebook.com') > -1) {
                    return;
                }

                if (event.url.indexOf('https://www.facebook.com') > -1) {
                    return;
                }

                if (event.url.indexOf('https://m.facebook.com/v2.6') > -1) {
                    return;
                }

                //Ignore the Meetup authorize screen
                if (event.url.indexOf('https://secure.meetup.com/oauth2/authorize') > -1) {
                    return;
                }

                if (event.url.indexOf('http://localhost/#error') > -1) {
                    browser.close();
                    alert('Could not authenticate');
                    reject('Could not authenticate');
                }

                //Check the redirect uri
                if (event.url.indexOf(this.redirectURI) > -1) {
                    listener.unsubscribe();
                    browser.close();
                    let token = event.url.split('=')[1].split('&')[0];
                    this.accessToken = token;
                    resolve(event.url);
                    this.getUserInfo()
                } else {
                    alert("Could not authenticate");
                    reject("Could not authenticate");
                }
            });
        });
    }
}
