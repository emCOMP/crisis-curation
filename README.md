[HCDE 598 Research Group](http://www.hcde.washington.edu/research/starbird)
===============

Content Curation Web App for Disaster Volunteers

Want to help out? First check out our wiki to set up your workstation.

How to Run Our Code
----------------------------
You'll need to start up both Chrome and our Server/DB
- **Chrome**: Linux: `/opt/google/chrome/google-chrome --disable-web-security` OSX: `open /Applications/Google\ Chrome.app --args --disable-web-security`
- **Server & DB**: `./start`
To restart use `./stop`

Flags available in start script:

1. `-m` Starts only mongo server daemon
2. `-h` Runs only historicTweets.py and processes it depends on.
3. `-c` Runs only crisisServer.py and processes it depends on.
4. `-i` Reserved. Will be used to do initialization stuff.
5. Behavior when no flags are mentioned: All 3 processes are started. Similar to `-mch`

Flags available in stop script:

1. `-m` Stops mongo server daemon and all processes that depend on it.
2. `-h` Stops only historicTweets.py.
3. `-c` Stops only crisisServer.py.
4. Behavior when no flags are mentioned: Stops all processes except the mongo server daemon. Similar to `-ch`.

If things aren't working you can do things manually [here](https://github.com/engz/crisis-curation/wiki/Starting-Server-Manually).

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
