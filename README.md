## DO NOT USE THIS :P

I do not recommend anyone to use this...

im sick of having to write long commands like `npm run lint:XXX` `docker-compose build X -d`, to make it worse every project is different...
so i made this so that i can create and load aliases per project. (i know i can probably do this natively)

`bs create alias -o "npm run lint:XXX" -n lint` now when i run `lint` in that project it runs one script and in another project it 
runs a different one!

You can also create global aliases by passing the `-g` flag, this will add a `source` to your .bash_profile. it is assumed that you have and use a bash_profile, hence the `do not use this`

## USE
**--allow-env** to get $HOME dir
**--allow-read/write** to create .sh fils to store aliases, and read/update bash_profile (reason one to not use this, it can mess up your bash_profile)
**--allow-run** use it to get `git remote -v` for the folder name of the project aliases. (reason two to not use this)

### Install:
  1. `deno install --allow-env --allow-read --allow-write --allow-run --unstable -n bs https://raw.githubusercontent.com/dennisolien/cli/master/mod.js`
  
### Create global alias
  1. `bs create alias -g -n hello -o 'echo hi'`
  2. re load bash_profile: `source ~/.bash_profile`

### create project alias
  1. `cool create alias -a hello -o 'echo hi'`
  2. reload bash_profile: `source /Users/[USER]/.bsAlias/project/git@github.com:[USER]/[PROJECT].git/index.sh` (the path is returned from 1.)


### Load alias:
  1. to load the alias on creation wrap it in an `eval` eg. `eval $(bs create alias -g -n hi -o 'echo world')`. I would like this to happen automatically, but i can't get the Deno.run subprocess to work, it returns 404 notFound on the file, and i do not know why.
  2. to load existing: `bs load alias` will return a `source` string to the file. again wrap it in an eval to execute it. or just copy the output and run it. 
  3. `bs load alias -g` will return the a `source` string to your bash_profile, eg `source /Users/[USER_NAME]/.bash_profile`.