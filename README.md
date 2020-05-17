## DO NOT USE THIS :P

I do not recommend anyone to use this...

im sick of having to write long commands like `npm run lint:XXX` `docker-compose build X -d`, to make it worse every project is different...
so i made this so that i can create and load aliases per project. (i know i can probably do this natively)

`cool create alias -o "npm run lint:XXX" -a lint` now when i run `lint` in that project it runs one script and in another project it 
runs a different one! 

## USE
**--allow-env** to get $HOME dir
**--allow-read/write** to create .sh fils to store aliases, and read/update bash_profile (reason one to not use this, it can mess up your bash_profile)
**--allow-run** use it to get `git remote -v` for the folder name of the project aliases. (reason two to not use this)

### Install:
  1. `deno install --allow-env --allow-read --allow-write --allow-run --unstable -n cool -f https://raw.githubusercontent.com/dennisolien/cli/master/mod.js`
  
### Create global alias
  1. `cool create alias -g -a hello -o 'echo hi'`
  2. re load bash_profile: `source ~/.bash_profile`

### create project alias
  1. `cool create alias -a hello -o 'echo hi'`
  2. reload bash_profile: `source /Users/[USER]/.bsAlias/project/git@github.com:[USER]/[PROJECT].git/index.sh` (the path is returned from 1.)