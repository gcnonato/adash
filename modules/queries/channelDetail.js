/*jslint node: true */
/*jslint nomen: true */

var request = require('request');

module.exports = function (channel, token, cb) {
    'use strict';
    
    var endDate       =new Date(),
        in_a_week   =new Date().setDate(endDate.getDate() - 7),
        week = new Date(in_a_week),
        end = endDate.toISOString().split('T')[0],
        start = week.toISOString().split('T')[0]
    
    
    
    
    var url = "https://www.googleapis.com/youtube/analytics/v1/reports?ids=contentOwner%3D%3Dthreehundred&start-date=" + start + "&end-date=" + end + "&metrics=views%2CestimatedMinutesWatched%2CaverageViewDuration%2CaverageViewPercentage%2CsubscribersGained&dimensions=day&filters=channel%3D%3D" + channel + "&sort=day&access_token=" + token,
        vidurl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' + channel + '&order=date&maxResults=50&access_token=' + token,
        silo = {
            videos: []
        };
    
    function channelStats(url) {
        
        request.get(url, function (e, r, b) {
            
            silo.channelStats = b;
            return cb(null, silo);
            
        });
        
    }
    
    function worker(vidurl) {
        
        request.get(vidurl, function (e, r, b) {
            
            var parsed = JSON.parse(b),
                npt = parsed.nextPageToken,
                i,
                item,
                videoDetailUrl,
                videoParse,
                vidstats,
                vidsnippet,
                details;
            
            /*
                push to the silo
            */
            
            function videoDetails(videoDetailUrl, count) {
                
                request.get(videoDetailUrl, function (e, r, b) {
                    
                    videoParse = JSON.parse(b);
                    
                    if (videoParse.items !== undefined) {
                        
                        if (videoParse.items[0] !== undefined) {
                        
                            details = {};

                            vidstats = videoParse.items[0].statistics;
                            vidsnippet = videoParse.items[0].snippet;

                            details.title = vidsnippet.title;
                            details.published = vidsnippet.publishedAt.split('T')[0];
                            details.views = vidstats.viewCount;
                            details.comments = vidstats.commentCount;
                            details.likes = vidstats.likeCount;

                            silo.videos.push(details);
                            //console.log(vidstats);

                        }
                        
                    }
                    
                });
            }
            
            for (i in parsed.items) {
                
                if (parsed.items[i] !== null) {
                    
                    item = parsed.items[i];
                    
                    //get the stats for each video
                    
                    videoDetailUrl = 'https://www.googleapis.com/youtube/v3/videos?part=statistics%2Csnippet&id=' + item.id.videoId + '&access_token=' + token;
                    
                    videoDetails(videoDetailUrl, i);
                    
                }
                
            }
            
            if (npt !== undefined) {
                
                vidurl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=' + channel + '&order=date&pageToken=' + npt + '&maxResults=50&access_token=' + token;
                
                worker(vidurl);
                
                
            } else {
                
                channelStats(url);
                
            }

        });
    }
    
    worker(vidurl);
    
    
};