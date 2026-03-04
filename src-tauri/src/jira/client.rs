use reqwest::Client;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use super::types::*;

const CACHE_TTL: Duration = Duration::from_secs(30);

struct CacheEntry {
    data: Vec<JiraIssue>,
    fetched_at: Instant,
}

pub struct JiraClient {
    client: Client,
    cache: Mutex<HashMap<String, CacheEntry>>,
}

impl JiraClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            cache: Mutex::new(HashMap::new()),
        }
    }

    pub async fn list_issues(
        &self,
        base_url: &str,
        token: &str,
        project_key: &str,
    ) -> Result<Vec<JiraIssue>, String> {
        let cache_key = format!("{}:{}", base_url, project_key);

        // Check cache
        {
            let cache = self.cache.lock().map_err(|e| e.to_string())?;
            if let Some(entry) = cache.get(&cache_key) {
                if entry.fetched_at.elapsed() < CACHE_TTL {
                    return Ok(entry.data.clone());
                }
            }
        }

        let jql = format!("project = {} ORDER BY updated DESC", project_key);
        let url = format!("{}/rest/api/3/search", base_url);

        let response = self
            .client
            .get(&url)
            .bearer_auth(token)
            .query(&[("jql", &jql), ("maxResults", &"50".to_string())])
            .send()
            .await
            .map_err(|e| format!("Jira API error: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Jira API returned {}: {}", status, body));
        }

        let result: JiraSearchResult = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Jira response: {}", e))?;

        // Update cache
        {
            let mut cache = self.cache.lock().map_err(|e| e.to_string())?;
            cache.insert(
                cache_key,
                CacheEntry {
                    data: result.issues.clone(),
                    fetched_at: Instant::now(),
                },
            );
        }

        Ok(result.issues)
    }

    pub async fn create_issue(
        &self,
        base_url: &str,
        token: &str,
        project_key: &str,
        summary: &str,
        description: Option<&str>,
    ) -> Result<JiraIssue, String> {
        let url = format!("{}/rest/api/3/issue", base_url);

        let body = CreateJiraIssue {
            fields: CreateJiraFields {
                project: ProjectKey {
                    key: project_key.to_string(),
                },
                summary: summary.to_string(),
                description: description.map(|d| d.to_string()),
                issuetype: IssueTypeRef {
                    name: "Task".to_string(),
                },
            },
        };

        let response = self
            .client
            .post(&url)
            .bearer_auth(token)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Jira API error: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body_text = response.text().await.unwrap_or_default();
            return Err(format!("Jira API returned {}: {}", status, body_text));
        }

        response
            .json()
            .await
            .map_err(|e| format!("Failed to parse Jira create response: {}", e))
    }
}
