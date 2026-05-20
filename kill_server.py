import os
import signal
import subprocess
import time

# find pid on port 5000
try:
    output = subprocess.check_output('netstat -ano | findstr :5000', shell=True).decode()
    lines = output.strip().split('\n')
    for line in lines:
        if 'LISTENING' in line:
            pid = line.split()[-1]
            print('Killing PID', pid)
            os.system(f'taskkill /F /PID {pid}')
            break
except Exception as e:
    print('Port 5000 is free')

time.sleep(1)
print('Done killing.')
