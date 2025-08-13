# AI Storyteller Application: Design Document

**Version:** 1.0
**Date:** 2025-08-12

## 1.0 Overview

This document outlines the architecture and specifications for an AI-powered storytelling application. The application will function as a "Dungeon Master" for solo role-playing campaigns, leveraging a forked version of the `lotcastingatemi` (LCA) web application and Google's Gemini API. The primary goal is to create an interactive, dynamic narrative experience where the AI can manage story progression, world state, and character interactions, while the player interacts through a chat interface.

The core challenges this design addresses are:
* **Minimizing API Costs:** Efficiently managing large context files (rules, lore) to reduce token usage.
* **State Management:** Allowing the AI and player to dynamically update campaign files.
* **Seamless Integration:** Integrating a chat interface and dice roller into the existing LCA framework.
* **AI Control:** Enabling the AI to make specific, actionable changes to player character data.

---

## 2.0 System Architecture

The application will use a three-tier architecture leveraging the existing `lotcastingatemi` stack, augmented with Google Cloud services for AI and knowledge management.

* **Frontend (Client-Side):** A **React.js** single-page application responsible for all user interaction.
* **Backend (Server-Side):** A **Ruby on Rails** API server that manages application logic, user authentication, and communication with external services.
* **Database:** A **PostgreSQL** database for storing user, campaign, and character sheet data.
* **AI Model:** **Google Gemini API** (via the `google-generative_ai` Ruby gem).
* **Knowledge Base:** **Google Cloud Vertex AI Search** for implementing Retrieval-Augmented Generation (RAG).
* **Deployment:** A **Docker-containerized** environment for consistent setup and deployment.

---

## 3.0 Data Management & File Structure

Data will be segregated into three distinct categories, each handled by a specific system.

### 3.1 AI Instructions (System Prompt)

* **File:** `AIA-ST Persona & Tasks.md`
* **Handling:** The **full content** of this file will be treated as a **system prompt**. It will be loaded from the application's file system and prepended to **every API call** made to the Gemini model. This ensures the AI's core persona and directives are constantly reinforced.

### 3.2 Reference Files (Static Knowledge Base)

* **Files:** `core_ruleset.md`, `charms-all.md`, `gazetteer.md`, and any other large, unchanging lore or rule documents.
* **Handling:** These files will be ingested into a **Vertex AI Search data store**. The application will use a RAG (Retrieval-Augmented Generation) workflow. When a user's prompt is received, the backend will first query the Vertex AI Search index to retrieve only the most relevant snippets of information. These snippets, not the full files, will be added to the Gemini prompt.

### 3.3 State Data (Dynamic Knowledge Base)

* **Files:** `chronicle.md`, `dramatis_personae.md`, etc. These files track the live state of the campaign and are modified by the AI.
* **Handling:** A **dual-RAG solution** will be implemented.
    1.  A **second, separate data store** will be created in Vertex AI Search specifically for these dynamic files.
    2.  During gameplay, this index will be queried for context just like the static knowledge base.
    3.  When a session concludes or reaches a designated checkpoint, the player will trigger an "End Session" action.
    4.  This action will prompt the AI to provide a final, updated version of the dynamic files.
    5.  The backend will save these new versions to the file system (and commit to Git for version control).
    6.  Finally, the backend will trigger a **re-indexing** of the updated files in the dynamic Vertex AI Search data store.

---

## 4.0 Feature Specifications

### 4.1 Chat Component

* A new React component, `ChatInterface.js`, will be created.
* This component will manage the display of the conversation history and a text input for the player.
* It will make API calls to a new `ai_storyteller_controller.rb` in the Rails backend.
* The backend will manage the conversation history, which will be saved to the database to persist between user sessions.

### 4.2 Dice Roller Component

* A new React component, `DiceRoller.js`, will be created, replicating the UI and logic of the provided standalone application.
* The component will be styled to match the LCA aesthetic.
* It will be integrated into the main campaign view (`Chronicle.js`) to be accessible during gameplay.

### 4.3 AI Control over Player Character Sheets

* The AI will be instructed to communicate changes to player character stats via a structured format.
* When the narrative requires a stat change, the Gemini API response will be a JSON object containing two keys:
    1.  `narrative`: The descriptive text for the player.
    2.  `actions`: An array of specific, machine-readable action objects.
* **Example `actions` object:**
    ```json
    {
      "actions": [
        {
          "action": "UPDATE_ESSENCE",
          "characterId": "player_character_id",
          "change": -5,
          "pool": "personal"
        }
      ]
    }
    ```
* The Rails backend will parse this `actions` array and execute the corresponding database updates against the player's character model. NPC stats will be managed internally by the AI and are not subject to this structured update mechanism.

---

## 5.0 Development Roadmap

1.  **Environment Setup:** Configure the forked LCA project to run locally using Docker.
2.  **Vertex AI Setup:** Create two data stores in Vertex AI Search (one for static, one for dynamic files) and ingest the initial documents.
3.  **Backend Development (Ruby on Rails):**
    * Create the `ai_storyteller_controller.rb`.
    * Implement the RAG workflow:
        * Receive player prompt.
        * Query both Vertex AI Search data stores.
        * Construct the final prompt for Gemini (System Instructions + Retrieved Context + Chat History + Player Prompt).
    * Implement the "End Session" logic for updating and re-indexing dynamic files.
    * Implement the parser for the AI `actions` JSON to update the database.
4.  **Frontend Development (React):**
    * Build and style the `DiceRoller.js` component and integrate it into `Chronicle.js`.
    * Build and style the `ChatInterface.js` component.
    * Connect the `ChatInterface.js` to the new backend endpoints.
5.  **Testing and Refinement:** Conduct end-to-end testing of the full gameplay loop.
