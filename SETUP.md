# 🛠️ Team Setup & Git Workflow Guide

Welcome to the **FocusFlow** team! This guide will walk you through the standard workflow for contributing to the project. Please follow these steps and rules to ensure a smooth collaboration process and prevent merge conflicts.

---

## 🚀 The Workflow

### 1. Clone the Repository
If you haven't already, clone the repository to your local machine:
```bash
git clone https://github.com/l4hgs/FocusFlow.git
cd FocusFlow
```

### 2. Update Your Local Main Branch
Before starting any new work, **always** make sure your local `main` branch is up to date with the remote repository.
```bash
git checkout main
git pull origin main
```

### 3. Create a New Branch
**Never make changes directly to the `main` branch.** Always create a new branch for your feature, bugfix, or task. 

Use a descriptive naming convention:
* `feature/your-feature-name` (e.g., `feature/dark-mode`)
* `bugfix/issue-description` (e.g., `bugfix/timer-sync-error`)
* `docs/update-readme`

```bash
git checkout -b feature/your-feature-name
```
*(The `-b` flag creates the branch and switches to it immediately).*

### 4. Make Changes and Commit
Make your code changes. When you are ready to save your progress, add and commit your files:

```bash
# Stage your changes
git add .

# Commit with a clear, descriptive message
git commit -m "feat: add user authentication to the backend"
```

### 5. Keep Your Branch Updated (Important!)
While you are working, other team members might be merging their code into `main`. To avoid massive conflicts later, **frequently update your branch** with the latest changes from `main`.

```bash
# Fetch the latest remote changes
git fetch origin

# Merge the latest main into your current branch
git merge origin/main
```
*If there are merge conflicts, Git will pause and ask you to resolve them in your code editor before completing the merge.*

### 6. Push Your Branch to GitHub
Once your feature is complete and your branch is up to date with `main`, push your branch to the remote repository.

*For the **first** time you push this branch:*
```bash
git push -u origin feature/your-feature-name
```
*For subsequent pushes, you can just type:*
```bash
git push
```

### 7. Create a Pull Request (PR)
1. Go to the GitHub repository in your browser.
2. You will see a prompt to "Compare & pull request" for your recently pushed branch. Click it.
3. Add a description of what your code does and request a review from a team member.
4. Once approved, your branch will be merged into `main`!

---

## 📜 Golden Rules & Best Practices

1. **Never commit directly to `main`:** `main` should always contain stable, working code.
2. **Pull frequently:** The longer you wait to `git pull origin main` or `git merge origin/main`, the harder the merge conflicts will be to resolve.
3. **Commit often, push often:** Don't wait until your entire feature is 100% done to commit. Small, incremental commits are easier to track and revert if something goes wrong.
4. **Write good commit messages:** Use standard prefixes like:
   * `feat:` (New feature)
   * `fix:` (Bug fix)
   * `docs:` (Documentation changes)
   * `style:` (Formatting, missing semi-colons, etc.)
   * `refactor:` (Code changes that neither fix a bug nor add a feature)
5. **Don't commit broken code:** Ensure the app compiles and runs locally (`dotnet run` and `npm run dev`) before opening a Pull Request.
