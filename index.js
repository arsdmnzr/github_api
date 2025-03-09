require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const GITHUB_API_BASE = "https://api.github.com";
const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
};

app.use(express.json());

/**
 * GET /github
 * Fetches GitHub profile data (followers, following, and repositories)
 */
app.get("/github", async (req, res) => {
  try {
    const userResponse = await axios.get(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`, { headers });
    const reposResponse = await axios.get(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos`, { headers });

    const userData = {
      username: userResponse.data.login,
      followers: userResponse.data.followers,
      following: userResponse.data.following,
      public_repos: reposResponse.data.map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
      })),
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || "Error fetching data" });
  }
});

/**
 * GET /github/:repo
 * Fetch details of a specific repository
 */
app.get("/github/:repo", async (req, res) => {
  try {
    const repoName = req.params.repo;
    const repoResponse = await axios.get(`${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${repoName}`, { headers });

    const repoData = {
      name: repoResponse.data.name,
      description: repoResponse.data.description,
      stars: repoResponse.data.stargazers_count,
      forks: repoResponse.data.forks_count,
      issues: repoResponse.data.open_issues_count,
      url: repoResponse.data.html_url,
    };

    res.json(repoData);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || "Repository not found" });
  }
});

/**
 * POST /github/:repo/issues
 * Creates a new issue in a specified repository
 */
app.post("/github/:repo/issues", async (req, res) => {
  try {
    const repoName = req.params.repo;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    const issueResponse = await axios.post(
      `${GITHUB_API_BASE}/repos/${GITHUB_USERNAME}/${repoName}/issues`,
      { title, body },
      { headers }
    );

    res.json({
      message: "Issue created successfully",
      issue_url: issueResponse.data.html_url,
    });
  } catch (error) {
    res.status(500).json({ error: error.response?.data || "Error creating issue" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
