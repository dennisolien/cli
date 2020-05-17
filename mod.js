const { args, env} = Deno;
import { parse } from 'https://deno.land/std@0.51.0/flags/mod.ts';
import { ensureDir, ensureFile, readFileStr, writeFileStr, walk, exists } from "https://deno.land/std@0.51.0/fs/mod.ts";

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
      const originalCommand = flags.org || flags.o;
      const alias = flags.alias || flags.a;
      if (!alias || !originalCommand) {
        return null;
      }
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

      const getGitRemote = Deno.run({
        cmd: ['git', 'remote', '-v'],
        stdout: "piped",
        stderr: "piped",
      });
      const { code } = await getGitRemote.status();

      if (code === 0) {
        const rawOutput = await getGitRemote.output();
        const gitRemoteString = new TextDecoder().decode(rawOutput);
        // TODO: regEx
        const pName = gitRemoteString.split('\n')[0]
          .replace('origin\t', '')
          .replace('(fetch)', '')
          .replace(' ', '');
        await ensureDir(`${aliasProject}/${pName}`);
        await writeFileStr(`${aliasProject}/${pName}/${alias}.sh`, `alias ${alias}="${originalCommand}"`);
        await buildBashIndex(`${aliasProject}/${pName}`);
        console.log(`To add alias to terminal session run: 'source ${aliasProject}/${pName}/index.sh'`)
      } else {
        const rawError = await getGitRemote.stderrOutput();
        const errorString = new TextDecoder().decode(rawError);
        console.log(errorString);
      }
    }
  },
  save: {
    alias: (flags) => {
      // TODO: commit the aliases.
    },
  },
  load: {
    alias: async (flags) => {
      const aliasProject = aliasesPath('project');
      const getGitRemote = Deno.run({
        cmd: ['git', 'remote', '-v'],
        stdout: "piped",
        stderr: "piped",
      });
      const { code } = await getGitRemote.status();

      if (code === 0) {
        const rawOutput = await getGitRemote.output();
        const gitRemoteString = new TextDecoder().decode(rawOutput);
        // TODO: regEx
        const pName = gitRemoteString.split('\n')[0]
          .replace('origin\t', '')
          .replace('(fetch)', '')
          .replace(' ', '');

        const str = `${aliasProject}/${pName}/index.sh`;
        // TODO: this returns 404...
        // await ensureFile(str)
        // const load = Deno.run({
        //   cmd: ['eval', `source ${str}`],
        // });
        // return load.status();
        return console.log(`source ${str}`)
      } else {
        const rawError = await getGitRemote.stderrOutput();
        const errorString = new TextDecoder().decode(rawError);
        console.log(errorString);
      }
    },
    bash: (flags) => {
      // TODO: reload bash_profile
    },
  },
};

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