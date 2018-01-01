const express = require('express')
const app = express()
const cheerio = require('cheerio')
const RSS = require('rss');
const request = require('request');
const resolveRelative = require('resolve-relative-url');


app.get('/', (req, res) => {
    var usersRequested = (req.query.users || 'alanmasters,EXCAVO').split(',')
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
    var feedItems = []

    var doneRequests = 0;
    
    for (let userIndex in usersRequested) {
        var user = usersRequested[userIndex]
        console.log('Running for ' + user)
        request('https://www.tradingview.com/u/' + user, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                const $ = cheerio.load(html);

                $('.js-feed-item .js-widget-idea').each(function(i, element) {
                    const title = $(this).find('.tv-widget-idea__title-name').text().trim()
                    const url = resolveRelative($(this).find('.tv-widget-idea__title').attr('href'), response.request.uri.href)
                    const author = $(this).find('.tv-user-link__name').text().trim()
                    const date = parseInt($(this).find('.tv-widget-idea__time').attr('data-timestamp'), 10) * 1000
                    const image = $(this).find('.tv-widget-idea__cover-link img').attr('src')
                    const description = $(this).find('.tv-widget-idea__description-text').text().trim()
                            + '<br /><img src="' + image + '" />'

                    const feedItem = {
                        title: title,
                        description: description,
                        url: url,
                        author: author,
                        date: date
                    }

                    feedItems.push(feedItem)
                })

            }

            doneRequests++;
            if (doneRequests == usersRequested.length) {
                // Sort items by date
                feedItems = feedItems.sort((a,b) => {
                    return b.date - a.date
                })

                // Add to feed
                const feed = new RSS({
                    title: 'TradingView Ideas',
                    feed_url: fullUrl,
                    site_url: fullUrl
                });
                feedItems.forEach(item => feed.item(item))

                // Output
                console.log('Done')
                res.set('Content-Type', 'application/rss+xml');
                res.send(feed.xml({indent: true}))
            }
        });
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Started at :' + PORT)
})
