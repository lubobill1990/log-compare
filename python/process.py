import glob
import re
import os

files = glob.glob('C:\\Users\\bolu1\\Downloads\\Performance log\\Performance log\\*.txt')

for filename in files:
    with open(filename, 'r') as f:
        width = 0
        height = 0
        basename = os.path.basename(filename)
        lines = f.readlines()
        for line in lines:
            searched = re.search(r'new frame size \((\d+), (\d+)\) ', line)
            if searched:
                width = searched.group(1)
                height = searched.group(2)
            else:
                searched = re.search(r'Video frame processing time percentile of app ([^:]+): \{"0.1":(\d+),"0.5":(\d+),"0.75":(\d+),"0.9":(\d+),"0.95":(\d+),"0.99":(\d+)\}', line)
                if searched:
                    app = searched.group(1)
                    p1 = searched.group(2)
                    p5 = searched.group(3)
                    p75 = searched.group(4)
                    p9 = searched.group(5)
                    p95 = searched.group(6)
                    p99 = searched.group(7)
                    print(f'{width},{height},{app},{p1},{p5},{p75},{p9},{p95},{p99},{basename}')
