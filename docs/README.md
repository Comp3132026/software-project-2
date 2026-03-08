# LifeSync
#### Build and Track Habits Together

## Overview

**LifeSync** is a collaborative platform designed for **group habit and task management**. This document serves as the primary **System Design Document (SDD)**, outlining the core architecture, user requirements (User Stories), and data models for the application. The system supports distinct roles—**Owner**, **Moderator**, **Member**, and **Viewer**—to facilitate structured collaboration and robust progress tracking.

---

## 🏗️ System Architecture and Data Models

This section provides the visual blueprints and underlying data structures guiding the system's development and implementation.

### System Architecture Design

The system architecture is the foundational blueprint defining the application's structure and the interaction between its components.

![System Architecture Design - Visual representation of the core components and data flow.](https://github.com/T4F25/LifeSync/blob/kghale/docs/system-architecture.png)

## 👤 User Stories & Requirements

The following user stories define the core features and functionality required, broken down by user role. Estimates are provided in hours.

### I. Group Owner Stories (GS) - Full Details

Group Owners hold **administrative rights** for group creation, membership control, and overall management.

#### A. Group Setup and Management

| ID | User Story | Priority | Estimate |
| :--- | :--- | :--- | :--- |
| **GS 1** | As a group owner, I want to **create a group** so that I can organize members and habits. | Must Have | 6 hours |
| **GS 4** | As a Group Owner, I want to **edit the group’s details** (name, description, and privacy settings) so that I can manage how the group appears to others. | Must Have | 2 hours |
| **GS 5** | As a group owner I want to **delete the group** so that I can remove inactive or unnecessary groups. | Must Have | 3 hours |

**Acceptance Criteria for Group Setup:**

* **GS 1 (Create Group):**
    * Given I am logged in as a group owner, when I enter a valid group name, the website will display it in my group list and direct me to the group page.
    * Given I try to create a group without a name or with invalid input, then the system displays an error message ("Group name required").
    * *Related:* When I receive a notification to join a group, then I can accept, and both groups will be visible under "my groups".
* **GS 4 (Edit Group Details):**
    * Given I am the group owner, when I choose to edit the group name, then the updated name must display for all members.
    * Given that I update the group description, when I save the change, then the new description must be visible to all users.
* **GS 5 (Delete Group):**
    * Given I am logged in as a group owner, when I click delete group the website will display a confirmation, then it will delete the group and display a success message.

#### B. Member and Role Management

| ID | User Story | Priority | Estimate |
| :--- | :--- | :--- | :--- |
| **GS 2** | As a group owner, I want to **add members** so that I can expand the group and manage their contributions. | Must Have | 2 hours |
| **GS 17** | As a group owner, I want to **assign roles** to members so that I can control their permissions and responsibilities within the group. | Must Have | 4 hours |

**Acceptance Criteria for Member Management:**

* **GS 2 (Add Members):**
    * Given I am logged in as group owner, when I click on the add member, then I can add members to the group.
    * Given I am logged in as group owner, when I click on the edit roles, then I can edit the roles of the members.
    * Given I am logged in as group owner, when I click on the change permissions, then I can change group members' permissions.
* **GS 17 (Assign Roles):**
    * Given I am the group owner, when I click on member's role drop down, then I can assign their role.

#### C. Task and Habit Lifecycle

| ID | User Story | Priority | Estimate |
| :--- | :--- | :--- | :--- |
| **GS 7** | As a group owner, I want to **create tasks** for members so that I can track their progress and ensure group goals are being completed on time. | Must Have | 8 hours |
| **GS 10** | As a Group Owner, I want to **assign tasks** to members so that I can distribute responsibilities and maintain accountability. | Must Have | 2 hours |
| **GS 3** | As a group owner, I want to **edit existing habits and tasks** so that I can mark them complete and keep their progress data organized. | Must Have | 2 hours |
| **GS 14** | As a group owner, I want to **edit the tasks created** so that I can update details and set or adjust deadlines when necessary. | Should Have | 4 hours |
| **GS 11** | As a Group Owner, I want to **view and approve completed tasks** so that I can verify that work has been properly done before final confirmation. | Should Have | 2 hours |

**Acceptance Criteria for Task Management:**

* **GS 7 (Create Tasks):**
    * Given I am on the "add task form", when I leave some fields blank, then the website will show "all fields are required".
    * Given I am the group owner, when I click the task, then I can see the task's status.
    * Given I am the group owner, when I click "add tasks," entered a valid title, description, members, and deadlines, then the website will show "task created successfully".
* **GS 10 (Assign Tasks):**
    * Given I am the Group Owner, when I assign a task to one or more members, then it appears in their task lists with the correct due date and assigned member details.
    * Given I am logged in as a group owner, when I create or view a task, then I can assign that task to one or more members within the group.
    * Given I assign a task, then the assigned member’s name appears beside that task in the task list or dashboard.
* **GS 3 (Edit & Complete):**
    * Given the group owner clicks the Edit button beside a habit or task, the system should open that item in edit mode with its current details displayed.
    * Given the group owner updates fields such as the title, description, frequency, or due date, and clicks Save, the system should store those changes and immediately show the updated information in the list.
    * Given the group owner marks a task or habit as Complete, the system should update its status and progress data to reflect completion.
* **GS 14 (Edit Created Tasks):**
    * Given I am the group owner, when I click "edit task", and update details and save, then task information will be updated.
    * Given I am the group owner, when I click “edit task”, I can see the task assigned and set deadline using date and time.
* **GS 11 (Approve Completed Tasks):**
    * Given I am logged in as a Group Owner, when I mark the task complete, then the task status updates to completed.
    * Given a task is marked complete, when the change is processed, then the system should record the completion time, date, and the user who completed it in the task history log.

#### D. Oversight, AI, and Communication

| ID | User Story | Priority | Estimate |
| :--- | :--- | :--- | :--- |
| **GS 13** | As a Group Owner, I want an **AI system to automatically suggest or route tasks** to the most suitable members so that workload is balanced, and deadlines are met efficiently. | Should Have | 6.5 hours |
| **GS 15** | As a group owner, I want to **receive notifications** so that I can stay updated on group's activities/progress and my personal tasks. | Should Have | 5-6 hours |
| **GS 8** | As a group owner, I want to **track the progress of the group on the dashboard** to monitor contribution and filter tasks/habits. | Could Have | 16 hours |
| **GS 6** | As a group owner, I want to **send announcements** so that I can share updates and important information to the members. | Could Have | 1 hour |

**Acceptance Criteria for Oversight & Communication:**

* **GS 13 (AI Task Suggestion):**
    * Given I am the Group Owner, when I create a new task, then the system’s AI should analyze group data such as completion history, workload, and member performance to suggest the most appropriate assignee.
    * Given an AI suggestion is generated, when I review the recommendation, then I can choose to accept or override it before saving the task.
* **GS 15 (Notifications):**
    * Given I am the group owner, when a member makes changes, then I receive a notification.
    * Given I am logged in as a Group Owner, when I complete a personal task, then I receive a notification that I have completed it.
    * Given I am logged in as a Group Owner, when I type a message into the text box and click "Send," then my message appears instantly in the chat feed AND it is visible to all group members.
    * Given the notification is turned off for more than 12 hours, then I can receive a notification to turn it on.
    * Given I have a personal task, when the deadline is approaching, then the website will send a notification to remind me.
    * Given I am logged in as group owner, when I click on a notification, then it will direct me to the group where changes were made.
* **GS 8 (Dashboard Tracking):**
    * Given I am the group owner, when I click on the dashboard, then I can track the group progress, completed tasks, average completion rate, etc.
    * Given I am the group owner, when I select "filter" icon, then the dashboard will show only tasks within that period time, status, and members.
* **GS 6 (Announcements):**
    * Given I am logged in as a Group Owner, when I click Pin or Highlight on a message, then the message moves to a pinned section, AND all group members can see pinned messages at the top of the chat.
    * Given I am the group owner, when I select "member contribution", then I see a chart showing completion percentage and number of tasks completed.

---

### II. Moderator Stories

Moderators are responsible for content moderation and community safety within a group.

| User Story | Priority | Estimate (Hours) |
| :--- | :--- | :--- |
| As a Moderator, I can **flag a member** as inactive or unresponsive, so that the Admin can review and decide whether to reassign their tasks. | Must Have | 1 |
| As a moderator, I want to **accept/reject new habits/tasks** added by the members so that only relevant work is added. | Must Have | 2-3 |
| As a moderator, I want to **edit or remove messages** that violate the guidelines so that the community stays safe and focused. | Should Have | 2 |
| As a Moderator, I want to **send warnings or notifications** to users who break discussion rules so they can correct their behavior. | Should Have | 2 |
| As a moderator, I want to **suspend a member** when they don't follow the rules so that chat will be organized. | Should Have | 2-3 |

---

### III. Member Stories

Members are active participants who contribute to the group's goals and tasks.

| User Story | Priority | Estimate (Hours) |
| :--- | :--- | :--- |
| As a Member, I can **view my group dashboard** so that I can see all tasks, habits, and progress updates in one place. | Must Have | 5 |
| As a Member, I can **create and complete habits or tasks** so that I can contribute to the group’s goals. | Must Have | 3-4 |
| As a Member, I can **send and receive messages** within my group’s discussion board so that I can communicate and coordinate tasks effectively. | Must Have | 2 |
| As a Member, I can **receive notifications** related to my assigned tasks and group updates so that I stay informed. | Should Have | 2 |
| As a Member, I can **view the list of members** in my group so that I know who I am collaborating with and their roles. | Could Have | 1 |

---

### IV. Viewer Stories

Viewers have read-only access to group progress and status updates.

| User Story | Priority | Estimate (Hours) |
| :--- | :--- | :--- |
| As a Viewer, I want to **view all tasks and their completion status** so that I can stay updated on group progress. | Must Have | 5 |

---

For complete details on feature validation and expected system behavior, please refer to the original source documentation, which contains the detailed **Acceptance Criteria** for each User Story.


### Data Models

#### 🧩 Class Diagram

The Class Diagram illustrates the primary classes, their attributes, operations, and the static relationships between them, essential for object-oriented design and defining application logic.

![Class Diagram - Showing the main classes and their interactions.](https://github.com/T4F25/LifeSync/blob/kghale/docs/classDiagram.png?raw=true)


#### 📊 Entity Relationship Diagram (ERD)

The ERD visualizes the relationships between the main data entities in the system, defining the structure of the database and ensuring data integrity.

![Entity Relationship Diagram - Visualizing the database schema and relationships.](https://github.com/T4F25/LifeSync/blob/kghale/docs/ERD.png?raw=true)


---


