const express = require('express')
const app = express()
const cheerio = require('cheerio')
const RSS = require('rss');
const feed = new RSS({
    title: 'TradingView Ideas',
    feed_url: 'http://db-tradingview-rss.herokuapp.com',
    site_url: 'http://db-tradingview-rss.herokuapp.com'
});
const request = require('request');


app.get('/', (req, res) => {
    var users = (req.query.users || 'alanmasters').split(',')
    
    var doneRequests = 0;
    
    for (let userIndex in users) {
        var user = users[userIndex]
        console.log("Running for " + user)
        request('https://www.tradingview.com/u/' + user, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);

                $(".js-feed-item .js-widget-idea").each(function(i, element) {
                    const title = $(this).find(".tv-widget-idea__title-name").text().trim()
                    const description = $(this).find(".tv-widget-idea__description-text").text().trim()
                    const url = response.request.uri.href + $(this).find(".tv-widget-idea__title").attr("href")
                    const author = $(this).find(".tv-user-link__name").text().trim()
                    const date = parseInt($(this).find(".tv-widget-idea__time").attr("data-timestamp"), 10)
                    const feedItem = {
                        title: title,
                        description: description,
                        url: url,
                        author: author,
                        date: date
                    }

                    // console.log(feedItem)
                    feed.item(feedItem)
                })

            }

            doneRequests++;
            if (doneRequests == users.length) {
                console.log("Done")
                res.set('Content-Type', 'text/xml');
                res.send(feed.xml({indent: true}))
            }
        });
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Started at :" + PORT)
})
