import { Octokit } from "@octokit/core";
import { env } from "process";
import { saveActivity } from "../../../models/githubactivity.server";
import { PrismaClient } from "@prisma/client";
const octokit = new Octokit({ auth: env.GITHUB_KEY });

const db = new PrismaClient();

function cleanUrlRepo(repoInfo: string) {
  if (repoInfo) {
    return repoInfo.substring(repoInfo.lastIndexOf("/") + 1);
  } else {
    return "";
  }
}

export const getActivity = async (repo: string, projectId: string) => {
  
  const owner = "wizeline";
  const repoUrlClean = cleanUrlRepo(repo);
  if(repo != ''){
    try{
      const repoActivity = await octokit.request(`GET /repos/${owner}/${repoUrlClean}/events`, {
        owner,
        repo,
      });
  
      if(repoActivity.status != 404){
        // eslint-disable-next-line no-console
        console.log( repo , repoUrlClean , repoActivity.status, repoActivity.headers["x-ratelimit-remaining"], repoActivity.data.length);
        repoActivity.data?.forEach( (activity: { id: string; type: string; created_at: string; actor: { display_login: string; avatar_url: string; }; }) => {
            saveActivity(activity.id , 
            activity.type?.replace(/([a-z0-9])([A-Z])/g, '$1 $2') as string, //this is for separe the string with camel case into pieces 
            activity.created_at as string, activity.actor.display_login as string, 
            activity.actor.avatar_url as string, projectId, db );
        return;
        });
      }
  
    
    }catch(e){
      console.error('the repo url doesnt exit', repoUrlClean);
    }

  }else{
    return;
  }
};

