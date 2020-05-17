const { args , cwd, env} = Deno;
import { parse } from 'https://deno.land/std@0.51.0/flags/mod.ts';
import { ensureDir, ensureFile, readFileStr, writeFileStr, walk } from "https://deno.land/std@0.51.0/fs/mod.ts";

const inputArgs = parse(args);

const bashProfilePath = `${env.get('HOME')}/.bash_profile`;
const aliasesPath = (folder) => `${env.get('HOME')}/.bsAlias/${folder}`;

async function buildBashIndex(dir) {
  const aliases = [];
  for await (const entry of walk(dir)) {
    if (entry && entry.isFile && entry.name !== 'index.sh') {
      const alias = await readFileStr(`${dir}/${entry.name}`, { encoding: 'utf8' });
      aliases.push(alias);
    }
  }
  return writeFileStr(`${dir}/index.sh`, aliases.join('\n'));
}

async function updateBashProfile(ref) {
  const org = await readFileStr(bashProfilePath, { encoding: 'utf8' });
  if (org.includes(ref)) {
    return true;
  }
  return writeFileStr(bashProfilePath, `${org}\n${ref}`);
}




const commands = {
  create: {
    alias: async (flags) => {
      const isGlobal = (flags.g || flags.global);
      const originalCommand = flags.org;
      const alias = flags.alias;
      if (!alias || !originalCommand) {
        return null;
      }
      const path = cwd(); // TEMP use user root .bs/
      const aliasGlobal = aliasesPath('global');
      const aliasProject = aliasesPath('project');
      await ensureDir(aliasGlobal);
      await ensureDir(aliasProject);

      if (isGlobal) {
        await writeFileStr(`${aliasGlobal}/${alias}.sh`, `alias ${alias}="${originalCommand}"`);
        await buildBashIndex(aliasGlobal);
        await updateBashProfile(`source ${aliasGlobal}/index.sh`);
        // TODO: need to update the terminal bash_profile source.
        return true
      }

      // TODO: get the git remote origin `/alias/project/${origin}/${alias}.sh
      return writeFileStr(`${aliasProject}/${alias}.sh`, `alias ${alias}="${originalCommand}"`);

      /**
       * TODO:
       * 1. X create global alias folder
       * 2. X create projects alias folder
       * 2.2 have sub folder, named after the projects git remote origin
       * 3. X alias folders new file for each alias.
       * 4. X export to bash_profile
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