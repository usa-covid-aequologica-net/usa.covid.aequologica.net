# [core]
# 	repositoryformatversion = 0
# 	filemode = true
# 	bare = false
# 	logallrefupdates = true
# 	ignorecase = true
# 	precomposeunicode = true
# [remote "origin"]
# 	url = git@github.com:cthiebaud/cthiebaud.github.io.git
# 	fetch = +refs/heads/*:refs/remotes/origin/*
# [branch "master"]
# 	remote = origin
# 	merge = refs/heads/master
# [remote "usa"]
# 	url = https://github.com/usa-covid-aequologica-net/usa.covid.aequologica.net
# 	fetch = +refs/heads/*:refs/remotes/usa/*
# [branch "usa"]
# 	remote = usa
# 	merge = refs/heads/master
# 

git checkout -b usa usa/master
git branch --set-upstream-to usa/master usa