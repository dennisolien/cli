## DO NOT USE THIS, or do, but you have been warned 💀

I do not recommend anyone to use this.

I'm sick of having to write long commands like `npm run lint:XXX` `docker-compose build X -d`, to make it worse every project is different.
I made this so that I can create and load aliases per project. (i know i can probably do this natively)

## USE
* **--allow-env** to get $HOME dir
* **--allow-read/write** to create .sh fils to store aliases, and read/update bash_profile (reason one to not use this, it can mess up your bash_profile)
* **--allow-run** use it to get `git remote -v` for the folder name of the project aliases, and to exec sh files (reason two to not use this 💀).

### Install 🦕:
  1. `deno install --allow-env --allow-read --allow-write --allow-run --unstable -n bs https://raw.githubusercontent.com/dennisolien/cli/master/mod.js`

## Alias
### Create global alias
  1. `bs create alias -g -n hello -o 'echo hi'`
  2. re load bash_profile: `source ~/.bash_profile`

### create project alias
  1. `bs create alias -a hello -o 'echo hi'`
  2. reload bash_profile: `source /Users/[USER]/.bsAlias/project/git@github.com:[USER]/[PROJECT].git/index.sh` (the path is returned from 1.)


### Load alias to the terminal session:
  1. to load the alias on creation wrap it in an `eval` eg. `eval $(bs create alias -g -n hi -o 'echo world')`. I would like this to happen automatically, but i can't get the Deno.run subprocess to work, it returns 404 notFound on the file, and i do not know why.
  2. to load existing: `bs load alias` will return a `source` string to the file. again wrap it in an eval to execute it. or just copy the output and run it. 
  3. `bs load alias -g` will return the a `source` string to your bash_profile, eg `source /Users/[USER_NAME]/.bash_profile`.

## Scripts
1. `bs create script -n|--name foo.sh` it creates a file name foo in the current project's scripts folder. (~/.bs/bin/project/[git remote])
2. `bs open` opens the current project's scripts folder. (~/.bs/bin/project/[git remote]) (will only work if the command `code` can be used to open a dir/file from the terminal) this is built for me, so sorry to any one trying to use it...
3. edit file `foo`
4. `bs r|run foo.sh` to run it.


### Commands:
1. `bs create alias` flags: -g|--global, -o|--org, -n|--name;
   1. create a new alias, can be global or local to a git repo.
2. `bs create script` flags: -n|--name;
   1. create a bash file, that can be executed by the `r` command
   2. scoped only to a git repo for now.
3. `bs load alias` flags: -g|--global;
   1. get file path to alias main file.
4. `bs open script` flags: -g|--global, -n|--name;
   1. open the scripts folder for the project. (dependent on vscode `code` command, will make it a config, maybe)
5. `bs ls` flags: -g|--global, -a|--alias, -s|--script
   1. list scripts andOr aliases.
6. `bs r|run [name of script].sh`
   1. execute a script.


## TODO:
1. remove alias|script
2. save commit .bs folder (push to a git repo.)
3. make more configurable, do not auto update .bash_profile.
4. open in option.
5. add global scope to scripts
6. r|run to exec alias to.
7. r|run to exec .js files too. (🦕)
