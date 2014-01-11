[HCDE 598 Research Group](http://www.hcde.washington.edu/research/starbird)
===============

Content Curation Web App for Disaster Volunteers

How to Run Our Code
----------------------------
You'll need to start up a bunch of things in many different terminal windows:
- **Bottle Server**: `python crisisServer.py`
- **Chrome**: `/opt/google/chrome/google-chrome --disable-web-security`
- **Historical Tweet Stream**: `python historicalTweets.py`
- **DB Shell**: `mongo`
- **Database**: `sudo mongod`

Setting Up Your Environment
--------------------------------------
- [Install MongoDB](https://github.com/engz/crisis-curation/edit/master/README.md#mongodb)
- Install Pip
- Install PyMongo
- Install Bottle
- Install Python-dateutil

### MongoDB
1. Download  & Install

  ***OSX:*** Download the files [here](http://www.mongodb.org/downloads) and extract the files:
  ```bash
  $ cd ~/Download
  $ tar xzf mongodb-osx-x86_64-2.2.3.tgz
  $ sudo mv mongodb-osx-x86_64-2.2.3 /usr/local/mongodb
  ```
  ***Linux:***
  ```bash
  $ apt-get install mongodb
  ```
2. Make a data storage location

  Make the folder where MongoDB can store data:
  ```bash
  $ sudo mkdir -p /data/db
  $ whoami
  <YOURUSERNAME>
  $ sudo chown <YOURUSERNAME> /data/db
  ```
3. Add mongodb to your PATH

  ```bash
  $ cd ~
  $ pwd
  /Users/<YOURUSERNAME>
  $ touch .bash_profile   // ONLY DO THIS IF YOU DON’T ALREADY HAVE A 
                          //.bash_profile
  $ nano .bash_profile    // This uses vim to edit a file - you can use
                          // pico or emacs, which are slightly easier to 
                          // use
  ```
  Once in an editor, add these lines:
  ```bash
  export MONGO_PATH=/usr/local/mongodb
  export PATH=$PATH:$MONGO_PATH/bin
  ```
4. Test that Mongo works:

  ```bash
  $ mongod
  ```
  Should print out a bunch, and specifically that it's waiting for connections. Ctr-C closes it.
