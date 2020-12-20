#!/usr/bin/env python3
print("ok");

import os
import re

dic = {}
imgs = os.listdir('img')
for i in imgs:
    dic[i] = False

def findfiles(path, regex):
    regObj = re.compile(regex)
    res = []
    for root, dirs, fnames in os.walk(path):
        for fname in fnames:
            if regObj.match(fname):
                res.append(os.path.join(root, fname))
    return res

files = findfiles('.', r'.*(js|css|html|md)')

for f in files:
    for i in imgs: 
        for line in open(f, 'r'):
            if re.search(i, line):
                print(line)
                dic.pop(i, None)

for k,v in dic.items():
    print(k)
    os.remove('img/'+k)


# # #!/usr/bin/env python3
# # import os
# # import re
# # import subprocess

# # def findfiles(path, regex):
# #     regObj = re.compile(regex)
# #     res = []
# #     for root, dirs, fnames in os.walk(path):
# #         for fname in fnames:
# #             if regObj.match(fname):
# #                 res.append(os.path.join(root, fname))
# #     return res

# # arr = findfiles('.', r'.*\.(js|html|css)')
# # imgs = os.listdir('img')

# # d = {}
# # for i in imgs:
# #     d[i] = False

# # for f in arr:
# #     good = False
# #     for i in imgs:
# #         for line in open(f).readlines():
# #             if re.search(i, line):
# #                 good = True
# #                 print(line)
# #         if good:
# #             print('REMOVED ' + i + ' CONTAINED IN ' + f)
# #             d.pop(i, None)
# #             good = False
# #     if good:
# #         print(f)
# #         print('---------')
# #         print()

# # for k,v in sorted(d.items()):
# #     print(k)
# #     # UNCOMMENT ME
# #     # os.remove('img/'+k)