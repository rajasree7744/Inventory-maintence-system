# **App Name**: SmartLink Computer Systems: Stock & Alert Manager

## Core Features:

- Customer Product Browsing & Interaction: Display a responsive product catalog with current stock status. Enable customer purchases through a modal form for collecting details, and allow feedback submission (rating, comment, defect reporting) via another modal.
- Admin Authentication & Access Control: Secure administrator login using Firebase Authentication, providing a dedicated email/password sign-in page and protecting access to the admin dashboard.
- Real-time Admin Dashboard Metrics: Provide a comprehensive dashboard for administrators, displaying real-time key performance indicators such as Total Sales, Total Products, and Low Stock count, with dynamic updates.
- Atomic Transaction Processing: Handle product purchases by atomically decrementing the stock quantity in Firestore's products collection and concurrently adding a detailed sales record to the sales collection.
- Automated Low Stock Alerting: Implement a Firebase Cloud Function to monitor product quantities. If any product's quantity falls below a predefined threshold (e.g., <5), it automatically generates and logs a 'lowstock' alert in the alerts collection.
- AI-Powered Negative Feedback Alerting: Utilize a Firebase Cloud Function as a tool to intelligently monitor customer feedback. It automatically generates a 'negativefeedback' alert if a rating is 2 stars or lower, or if the comment contains keywords indicating a problem (e.g., 'defect', 'damaged', 'broken').
- Instant UI Data Synchronization: Ensure a highly responsive user experience by using Firestore real-time listeners (onSnapshot) to instantly update stock levels, alert feeds, and dashboard statistics across all active user interfaces without requiring manual page refreshes.

## Style Guidelines:

- Color scheme: Dark and modern, evoking professionalism and technology.
- Primary interactive color: A rich, deep indigo-violet for interactive elements like buttons and highlights (#4826D9).
- Background color: A subtle, desaturated dark purple for a modern, calm aesthetic (#1F1C26).
- Secondary accent color: A softer, brighter blue for complementary elements and secondary actions (#A6C4E2).
- Alert/Error color: A prominent and impactful red for highlighting low stock or critical negative feedback (#E61919).
- Headline font: 'Space Grotesk' (sans-serif) for a modern, technical, and attention-grabbing feel.
- Body font: 'Inter' (sans-serif) for clear readability of product descriptions, feedback, and dashboard text.
- Utilize a consistent set of minimalist, vector-based icons throughout the application, adhering to a professional and clear aesthetic suitable for a modern tech platform.
- Implement a responsive design with product cards arranged in a grid, and maintain a 'Sticky' Navigation Bar for easy access. The Admin Dashboard features a clear notification feed at the top and prominent buttons for navigation.
- Incorporate subtle hover effects on product cards and smooth transitions for modal openings to enhance user interaction and convey a polished, modern feel.