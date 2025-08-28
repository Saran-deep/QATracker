import type { StoryWithDetails, UserWithStats } from "@/types";

export function exportToCSV(data: any[], filename: string = 'export.csv') {
  if (data.length === 0) return;

  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle nested objects, arrays, and special characters
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Wrap in quotes if contains comma, newline, or quote
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatStoriesForExport(stories: StoryWithDetails[]) {
  return stories.map(story => ({
    'Story ID': story.ticketId,
    'Title': story.title,
    'Creator': story.creator.firstName && story.creator.lastName ? 
      `${story.creator.firstName} ${story.creator.lastName}` : 
      story.creator.email,
    'Reviewer': story.reviewer ? 
      (story.reviewer.firstName && story.reviewer.lastName ? 
        `${story.reviewer.firstName} ${story.reviewer.lastName}` : 
        story.reviewer.email) : 
      'Not assigned',
    'Coverage %': story.coverageScore ? `${parseFloat(story.coverageScore).toFixed(1)}%` : 'Pending',
    'Status': !story.coverageScore ? 'Pending Review' : 
      parseFloat(story.coverageScore) >= 90 ? 'Pass' : 'Fail',
    'Date Created': new Date(story.createdAt).toLocaleDateString(),
    'Date Completed': story.dateCompleted ? 
      new Date(story.dateCompleted).toLocaleDateString() : 
      'Not completed',
  }));
}

export function formatUsersForExport(users: UserWithStats[]) {
  return users.map(user => ({
    'User': user.firstName && user.lastName ? 
      `${user.firstName} ${user.lastName}` : 
      user.email,
    'Role': user.role.charAt(0).toUpperCase() + user.role.slice(1),
    '# Stories': user.totalStories,
    'Avg Coverage %': `${user.averageCoverage.toFixed(1)}%`,
    'Status': user.status === 'pass' ? 'Pass (≥90%)' : 'Fail (<90%)',
    'Below 90%?': user.status === 'fail' ? 'Yes' : 'No',
  }));
}