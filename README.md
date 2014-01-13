[HCDE 598 Research Group](http://www.hcde.washington.edu/research/starbird)
===============

Content Curation Web App for Disaster Volunteers

Want to help out? First check out our wiki to set up your workstation.

How to Run Our Code
----------------------------
You'll need to start up a bunch of things in many different terminal windows:
- **Bottle Server**: `python crisisServer.py`
- **Chrome**: Linux: `/opt/google/chrome/google-chrome --disable-web-security` OSX: `open /Applications/Google\ Chrome.app --args --disable-web-security`
- **DB Shell**: `mongo`
- **Database**: `sudo mongod`
- **Historical Tweet Stream**: `python historicalTweets.py` Note - this eventually runs out of tweets. See 'Resetting Historical Tweet Stream'.


Resetting Historical Tweet Stream
--------------------------------------
You'll know you've run out of tweets once you see this one pop up: 

"Ottawa overrules health officials on heroin replacement study - OTTAWA &amp" from wwwHUMORcat
***or***
"RT @TornadoTitans: “@yaya_castillo: This pipeline explosion is 50+ miles east between Forgan &amp" from Leonisx


At this point, you need to restart the historical tweet stream. This can be accomplished by:

1. Opening the DB Shell [see above]
2. Type in: `use current_database` and press enter
3. Type in: `db.tweets.drop()` and press enter.
4. You should see `true` outputted back to you.
5. Stop the historical tweet stream [see above] by typing `Ctrl-C` and then starting it up again.
