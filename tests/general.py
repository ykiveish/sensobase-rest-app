import urllib2
import sys
import json
import os

Response = ""

os.system('clear')
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/users/ux0xhwyqocp").read()
if "security issue" not in Response:
  print "METHOD select/users ... SUCCESS [" + Response + "]"
else:
  print "METHOD select/users ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/insert/user/ux0xhwyqocp/ykiveish/1234").read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD insert/user ... SUCCESS [" + Response + "]"
  else:
    print "METHOD insert/user ... WARNING [" + Response + "]"
else:
  print "METHOD insert/user ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/users/ux0xhwyqocp").read()
jsonData = json.loads(Response)
if (len(jsonData) > 0):
	user = jsonData[0]
else:
	sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/user/" + user['key'] + "/" + user['userName'] + "/" + user['password']).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD select/user [U/P] ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user [U/P] ... WARNING [" + Response + "]"
else:
  print "METHOD select/user [U/P] ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/user/ux0xhwyqocp/" + user['userName'] + "/" + user['password']).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD select/user [U/P] ADMIN ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user [U/P] ADMIN ... WARNING [" + Response + "]"
else:
  print "METHOD select/user [U/P] ADMIN ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/user/" + user['key'] + "/" + str(user['id'])).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD select/user [ID] ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user [ID] ... WARNING [" + Response + "]"
else:
  print "METHOD select/user [ID] ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/user/ux0xhwyqocp/" + str(user['id'])).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD select/user [ID] ADMIN ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user [ID] ADMIN ... WARNING [" + Response + "]"
else:
  print "METHOD select/user [ID] ADMIN ... FAILED"
  sys.exit(0)

#
# Testing user delete method.
#
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/delete/user/ux0xhwyqocp/" + str(user['id'])).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD delete/user ADMIN ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user ADMIN ... WARNING [" + Response + "]"
else:
  print "METHOD select/user ADMIN ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/user/ux0xhwyqocp/" + str(user['id'])).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD select/user [ID] ADMIN ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user [ID] ADMIN ... WARNING [" + Response + "]"
else:
  print "METHOD select/user [ID] ADMIN ... FAILED"
  sys.exit(0)

Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/insert/user/ux0xhwyqocp/ykiveish/1234").read()
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/users/ux0xhwyqocp").read()
jsonData = json.loads(Response)
if (len(jsonData) > 0):
  user = jsonData[0]
else:
  sys.exit(0)
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/select/user/" + user['key'] + "/" + str(user['id'])).read()
if "security issue" not in Response:
  if "user exist" not in Response:
    print "METHOD select/user [ID] ... SUCCESS [" + Response + "]"
  else:
    print "METHOD select/user [ID] ... WARNING [" + Response + "]"
else:
  print "METHOD select/user [ID] ... FAILED"
  sys.exit(0)

#
# Testing login method.
#
Response = urllib2.urlopen("http://ec2-35-161-108-53.us-west-2.compute.amazonaws.com:8080/login/" + user['userName'] + "/" + user['password']).read()
if "user exist" not in Response:
  print "METHOD login ... SUCCESS [" + Response + "]"
else:
  print "METHOD login ... WARNING [" + Response + "]"


print "\nALL DONE .... "