// Copyright 2020 Dennis Lien. All rights reserved. MIT license.

const { args, env} = Deno;
import { parse } from 'https://deno.land/std@0.51.0/flags/mod.ts';
import { ensureDir, readFileStr, writeFileStr, walk } from "https://deno.land/std@0.51.0/fs/mod.ts";
import * as logger from 'https://deno.land/std/log/mod.ts';

const inputArgs = parse(args);

/**
 * 1. X Easy to create alias
 * 2. X Scoped alias
 * 3. X easy to load scoped alias
 * 4. create scripts, to automate tasks, should run bash and JS/Deno
 * 5. X move to .bin folder
 * 6. X bash link to .bin/global
 * 7. X load from bin/project/[git origin of project]
 */

const bashProfilePath = `${env.get('HOME')}/.bash_profile`;

const bsHome = `${env.get('HOME')}/.bs`;
const bsBin = `${bsHome}/bin`;
const bsGlobals = `${bsBin}/global`;
const bsProjects = `${bsBin}/project`;
const bsProject = (projectName) => `${bsProjects}/${projectName}`;
const bsAliasMain = (aliasDir) => `${aliasDir}/main.sh`;

const createAliasFilePath = (dir, name) => `${dir}/${name}.sh`
const createAliasStr = (name, command) => `alias ${name}="${command}"`

const toSourceString = (filePath) => `source ${filePath}`;

async function ensureBs() {
  await ensureDir(bsGlobals);
  await ensureDir(bsProjects);
  return true;
}


async function upsertFolderMain(aliasDir) {
  const aliases = [];
  const mainPath = bsAliasMain(aliasDir);
  for await (const entry of walk(aliasDir)) {
    if (entry && entry.isFile && entry.name !== 'main.sh') {
      const alias = await readFileStr(`${aliasDir}/${entry.name}`, { encoding: 'utf8' });
      aliases.push(alias);
    }
  }
  await writeFileStr(mainPath, aliases.join('\n'));
  return mainPath;
}

async function updateBashProfile(source) {
  const org = await readFileStr(bashProfilePath, { encoding: 'utf8' });
  if (org.includes(source)) {
    return true;
  }
  return writeFileStr(bashProfilePath, `${org}\n${source}\n`);
}

async function createAliasFile(dir, name, command) {
  const filePath = createAliasFilePath(dir, name);
  const aliasString = createAliasStr(name, command);

  await writeFileStr(filePath, aliasString);
  return {
    filePath,
    aliasString,
  };
}

async function getProjectDir(aliasDir, name) {
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
    const projectName = gitRemoteString.split('\n')[0]
      .replace('origin\t', '')
      .replace('(fetch)', '')
      .replace(' ', '')
      .replace('.git', '');

    const projectPath = bsProject(projectName);
    await ensureDir(projectPath);
    return projectPath;
  } else {
    const errorString = new TextDecoder().decode(rawError);
    logger.error(errorString);
    throw new Error('Unable to get the git remote Origin');
  }
}

const commands = {
  create: {
    alias: {
      exec: async (flags) => {
        const isGlobal = (flags.g || flags.global);
        const originalCommand = flags.org || flags.o;
        const name = flags.name || flags.n;
        const aliasDir = isGlobal ? bsGlobals : await getProjectDir();

        if (!name || !originalCommand) {
          // TODO: return help
          return logger.error(
            'Name (--name, -n) and "original command" (--org, -o) is required',
          );
        }

        await ensureBs();

        const { aliasPath, aliasString } = await createAliasFile(aliasDir, name, originalCommand);
        const aliasMainPath = await upsertFolderMain(aliasDir)
        const sourceString = toSourceString(aliasMainPath);

        if (isGlobal) {
          await updateBashProfile(sourceString);
          // TODO: this returns 404 not found... why?
          // const sourceFile = Deno.run({
          //   cmd: ['source', aliasMainPath],
          // });
          return console.log(toSourceString(bashProfilePath));
        }

        return console.log(sourceString);
      },
      help: (flags) => {
        logger.info('TODO: add help')
      },
    },
  },
  load: {
    alias: {
      exec: async (flags) => {
        const isGlobal = (flags.g || flags.global);
        const aliasDir = isGlobal ? bsGlobals : await getProjectDir();
        const mainPath = bsAliasMain(aliasDir);
        if (isGlobal) {
          return console.log(toSourceString(bashProfilePath));
        }
        return console.log(toSourceString(mainPath)); 
      },
    }
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
  }, commands)
  if (typeof func.exec !== 'function') {
    // TODO: return help
    return logger.info('Missing props');
  }
  return func.exec(rest);
}

runner(inputArgs);