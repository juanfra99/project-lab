import Header from "../../../core/layouts/Header";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { getProjectById } from "~/models/project.server";
import { Form, useLoaderData } from "@remix-run/react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { formatDistance } from "date-fns";
import invariant from "tiny-invariant";
import Markdown from "marked-react";
import { useOptionalUser } from "~/utils";
import { getAppliedProjectsByEmail } from "~/models/applicant.server";
import { requireProfile } from "~/session.server";

export const loader = async ({ request, params }: LoaderArgs) => {
  invariant(params.projectId, "projectId not found");

  const profile = await requireProfile(request);
  const projects = await getProjectById(params.projectId);
  const appliedProjects = await getAppliedProjectsByEmail(profile.email);

  if (!projects.id) {
    throw new Error("project not found");
  }

  return {
    projects,
    appliedProjects,
  };
};

export default function ProjectDetail() {
  const { projects, appliedProjects } = useLoaderData();

  const skills = projects.searchSkills
    ? projects.searchSkills
        .trim()
        .split(",")
        .map((skill: string) => ({ name: skill }))
    : [];

  const user = useOptionalUser();

  return (
    <>
      <Header title={projects.name || ""} />

      <Container sx={{ marginBottom: 2 }}>
        <Paper
          sx={{
            paddingLeft: 2,
            paddingRight: 2,
            paddingBottom: 2,
            position: "relative",
          }}
        >
          <Grid container justifyContent="space-between">
            <Grid item>
              <h1 style={{ marginBottom: 0 }}>{projects.name}</h1>
              <Typography color="text.secondary">
                Last update:{" "}
                {projects.updatedAt &&
                  formatDistance(new Date(projects.updatedAt), new Date(), {
                    addSuffix: true,
                  })}
              </Typography>
            </Grid>
          </Grid>
          <p className="descriptionProposal">{projects.description}</p>
          {user && (
            <Grid style={{ position: "absolute", top: 0, right: 0 }}>
              <Form
              method="put"
              action='./appliedproject'
              >
              <Button
                className="contained"
                type='submit'
                sx={{
                  width: "200px",
                  height: "40px",
                  fontSize: "1em",
                  margin: 2,
                }}
                disabled={appliedProjects.includes(projects.name)}
              >
                APPLY
              </Button>
              </Form>
            </Grid>
          )}
        </Paper>
      </Container>
      <Container>
        <Grid spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Description" />
              <CardContent>
                <div>
                  <Markdown>
                    {projects.valueStatement ? projects.valueStatement : ""}
                  </Markdown>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      <Container sx={{ marginBottom: 2, marginTop: 2 }}>
        <Card>
          <CardHeader title="Skills:" />
          <CardContent>
            {skills.map((skill: any) => (
              <Chip
                key={skill.name}
                label={skill.name}
                sx={{ marginRight: 1, marginBottom: 1 }}
              />
            ))}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}