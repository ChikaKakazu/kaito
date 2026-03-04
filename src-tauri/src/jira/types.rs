use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraIssue {
    pub key: String,
    pub fields: JiraFields,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraFields {
    pub summary: String,
    pub description: Option<String>,
    pub status: Option<JiraStatus>,
    pub priority: Option<JiraPriority>,
    pub issuetype: Option<JiraIssueType>,
    pub assignee: Option<JiraUser>,
    pub created: Option<String>,
    pub updated: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraStatus {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraPriority {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraIssueType {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraUser {
    #[serde(rename = "displayName")]
    pub display_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JiraSearchResult {
    pub issues: Vec<JiraIssue>,
    pub total: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateJiraIssue {
    pub fields: CreateJiraFields,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateJiraFields {
    pub project: ProjectKey,
    pub summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub issuetype: IssueTypeRef,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectKey {
    pub key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IssueTypeRef {
    pub name: String,
}
