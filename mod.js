const { args } = Deno;
import { parse } from 'https://deno.land/std/flags/mod.ts';

const inputArgs = parse(args);

const commands = {
  create: {
    alias: (flags) => {
      const isGlobal = (flags.g || flags.global);
      const originalCommand = flags.org;
      const alias = flags.alias;
      /**
       * TODO:
       * 1. create global alias folder
       * 2. create projects alias folder
       * 2.2 have sub folder, named after the projects git remote origin
       * 3. alias folders new file for each alias.
       * 4. export to bash_profile
       * 5. prompt user to create git repo to store aliases.
       */
    }
  }
}

function runner(input) {
  const { _, ...rest } = input;
  const func = _.reduce((result, name) => {
   if (!result[name]) {
     // TODO: return help
     throw new Error('Not a command');
   } 
   return result[name];
  }, {...commands})
  if (typeof func !== 'function') {
    // TODO: return help
    return console.log('Missing props');
  }
  return func(rest);
}

runner(inputArgs);