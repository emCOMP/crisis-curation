import ConfigParser
import os

DEFAULT_FILE = os.path.join(os.path.dirname(__file__), 'config.cfg')

def read_system_configs(filename=DEFAULT_FILE):
    config = ConfigParser.ConfigParser()
    config.read(filename)
    return dict(config.items('crisisSystem'))

def read_historical_configs(filename=DEFAULT_FILE):
    config = ConfigParser.ConfigParser()
    config.read(filename)
    return dict(config.items('historical'))

def read_live_configs(filename=DEFAULT_FILE):
    config = ConfigParser.ConfigParser()
    config.read(filename)
    return dict(config.items('live'))

if __name__ == "__main__":
    test_file = os.path.join(os.path.dirname(__file__), 'config.cfg.sample')
    print read_system_configs(test_file)
