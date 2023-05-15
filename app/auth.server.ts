import invariant from "tiny-invariant";
import { Authenticator } from "remix-auth";
import { Auth0Strategy } from "remix-auth-auth0";
import { sessionStorage } from "~/session.server";
import type { User } from "~/models/user.server";
import { findOrCreate } from "~/models/user.server";
import {
  createProfile,
  getProfileByEmail,
  getGitHubProfileByEmail,
  updateProfile,
  createGitHubProfile,
  createGitHubProject,
} from "./models/profile.server";
import { findProfileData } from "./lake.server";
import { getUserInfo, getUserRepos } from "./routes/api/github/get-getUserInfo";

invariant(process.env.AUTH0_CLIENT_ID, "AUTH0_CLIENT_ID must be set");
invariant(process.env.AUTH0_CLIENT_SECRET, "AUTH0_CLIENT_SECRET must be set");
invariant(process.env.AUTH0_DOMAIN, "AUTH0_DOMAIN must be set");

// Create an instance of the authenticator, pass a generic with what your
// strategies will return and will be stored in the session
export const authenticator = new Authenticator<User>(sessionStorage);

let auth0Strategy = new Auth0Strategy(
  {
    callbackURL: `${process.env.BASE_URL}/auth/auth0/callback`,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
  },
  async ({ accessToken, refreshToken, extraParams, profile }) => {
    try {
      if (profile.emails == undefined || !profile.emails[0]) {
        throw new Error("we need an email to login");
      }
      // search profile in our DB or get from data lake
      const email = profile.emails[0].value;
      const userProfile = await getProfileByEmail(email);
      if (userProfile?.githubUser === '' || userProfile?.githubUser === null) {
        const { data } = await getUserInfo(email);
        if (data.total_count > 0) {
          const gitHubUser = data.items[0].login;
          userProfile.githubUser = gitHubUser;
          try{
            updateProfile(userProfile, userProfile.id);
          }catch{
            throw('error');
          }
        }
      }
      if (!userProfile) {
        const lakeProfile = await findProfileData(email);
        createProfile({
          id: String(lakeProfile.contact__employee_number),
          email: lakeProfile.contact__email,
          firstName: lakeProfile.contact__first_name,
          preferredName:
            lakeProfile.contact__preferred_name ||
            lakeProfile.contact__first_name,
          lastName: lakeProfile.contact__last_name,
          department: lakeProfile.contact__department,
          jobLevelTier: lakeProfile.contact__wizeos__level,
          jobLevelTitle: lakeProfile.contact__title,
          avatarUrl: lakeProfile.contact__photo__url,
          location: lakeProfile.contact__location,
          country: lakeProfile.contact__country,
          employeeStatus: lakeProfile.contact__employee_status,
          businessUnit: lakeProfile.contact__business_unit,
          benchStatus: lakeProfile.contact__status,
        });
      }
      const userGitHubProfile = await getGitHubProfileByEmail(email);
      if (userGitHubProfile?.email === '' || userGitHubProfile?.email === null || userGitHubProfile?.email === undefined)  {
        const { data: userInfo } = await getUserInfo(email);
        const { data: repos } = await getUserRepos(userInfo.items[0].login)
        await createGitHubProfile(email, userInfo.items[0].login, userInfo.items[0].avatar_url, userInfo.items[0].repos_url);
        

        for (const repo of repos) {
          const date = new Date(repo.updated_at);
          const formattedDate = date.toLocaleString();
          const name = repo.name ? repo.name : "No name available";
          const description = repo.description ? repo.description : "No description available";
  
          await createGitHubProject(email, name, description, formattedDate);
        }
     }
      // Get the user data from your DB or API using the tokens and profile     
      return findOrCreate({
        email: profile.emails[0].value,
        name: profile.displayName || "Unnamed",
      });
    } catch (e) {
      throw e;
    }
  }
);

authenticator.use(auth0Strategy);
