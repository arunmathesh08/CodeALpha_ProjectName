import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Demo Users
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      gender: 'MALE',
      password: passwordHash
    }
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      gender: 'FEMALE',
      password: passwordHash
    }
  });

  const michael = await prisma.user.create({
    data: {
      name: 'Michael Scott',
      email: 'michael@example.com',
      gender: 'MALE',
      password: passwordHash
    }
  });

  console.log('✅ Created demo users (alex@example.com, sarah@example.com, michael@example.com / password123)');

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'TaskFlow SaaS Platform 2.0',
      description: 'Full-stack collaborative project management platform with real-time Kanban boards and notifications.',
      status: 'ACTIVE',
      ownerId: alex.id,
      members: {
        create: [
          { userId: alex.id, role: 'OWNER' },
          { userId: sarah.id, role: 'ADMIN' },
          { userId: michael.id, role: 'MEMBER' }
        ]
      }
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      description: 'Revamping the iOS and Android applications with modern design guidelines and offline sync.',
      status: 'ACTIVE',
      ownerId: sarah.id,
      members: {
        create: [
          { userId: sarah.id, role: 'OWNER' },
          { userId: alex.id, role: 'MEMBER' }
        ]
      }
    }
  });

  // 3. Create Boards & Columns for Project 1
  const board1 = await prisma.board.create({
    data: {
      name: 'Main Board',
      projectId: project1.id
    }
  });

  const colTodo = await prisma.column.create({
    data: { name: 'To Do', order: 0, boardId: board1.id }
  });

  const colInProgress = await prisma.column.create({
    data: { name: 'In Progress', order: 1, boardId: board1.id }
  });

  const colReview = await prisma.column.create({
    data: { name: 'Review', order: 2, boardId: board1.id }
  });

  const colCompleted = await prisma.column.create({
    data: { name: 'Completed', order: 3, boardId: board1.id }
  });

  // 4. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Implement Dark & Light Theme Switcher',
      description: 'Add persistent theme preference in localStorage and support smooth transition animations across all pages.',
      priority: 'HIGH',
      order: 0,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      columnId: colTodo.id,
      projectId: project1.id,
      creatorId: alex.id,
      assigneeId: sarah.id
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Design Kanban Drag-and-Drop UX',
      description: 'Use @hello-pangea/dnd for fluid task dragging with column reordering and visual drop placeholders.',
      priority: 'URGENT',
      order: 1,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      columnId: colInProgress.id,
      projectId: project1.id,
      creatorId: alex.id,
      assigneeId: alex.id
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Socket.IO Real-time Events Integration',
      description: 'Broadcast task updates, new comments, and member additions live to all connected team members.',
      priority: 'HIGH',
      order: 0,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      columnId: colInProgress.id,
      projectId: project1.id,
      creatorId: sarah.id,
      assigneeId: michael.id
    }
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'API Authentication & JWT Guards',
      description: 'Validate authorization headers with bcrypt password encryption and token verification middleware.',
      priority: 'MEDIUM',
      order: 0,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday (completed)
      columnId: colCompleted.id,
      projectId: project1.id,
      creatorId: alex.id,
      assigneeId: alex.id
    }
  });

  const task5 = await prisma.task.create({
    data: {
      title: 'Write Unit & Integration Tests',
      description: 'Ensure comprehensive coverage for authentication, board movements, and comment CRUD operations.',
      priority: 'LOW',
      order: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      columnId: colReview.id,
      projectId: project1.id,
      creatorId: michael.id,
      assigneeId: sarah.id
    }
  });

  // 5. Create Comments
  await prisma.comment.create({
    data: {
      content: 'I have verified the Tailwind dark mode class strategy. It works seamlessly!',
      taskId: task1.id,
      userId: sarah.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Great! Let me know once the preview is ready for testing.',
      taskId: task1.id,
      userId: alex.id
    }
  });

  await prisma.comment.create({
    data: {
      content: 'Drag-and-drop animation feels super smooth with nice hover drop indicators.',
      taskId: task2.id,
      userId: alex.id
    }
  });

  // 6. Create Notifications
  await prisma.notification.create({
    data: {
      userId: alex.id,
      title: 'New Comment',
      message: 'Sarah Connor commented on "Implement Dark & Light Theme Switcher"',
      type: 'COMMENT_ADDED',
      link: `/projects/${project1.id}?task=${task1.id}`,
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: alex.id,
      title: 'Task Assigned',
      message: 'You have been assigned to "Design Kanban Drag-and-Drop UX"',
      type: 'TASK_ASSIGNED',
      link: `/projects/${project1.id}?task=${task2.id}`,
      isRead: true
    }
  });

  // 7. Create Activities
  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: alex.id,
      action: 'CREATED_PROJECT',
      details: 'Created project "TaskFlow SaaS Platform 2.0"'
    }
  });

  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: sarah.id,
      action: 'MOVED_TASK',
      details: 'Moved "Design Kanban Drag-and-Drop UX" to In Progress'
    }
  });

  await prisma.activity.create({
    data: {
      projectId: project1.id,
      userId: michael.id,
      action: 'ADDED_COMMENT',
      details: 'Commented on "Implement Dark & Light Theme Switcher"'
    }
  });

  console.log('✅ Seed completed successfully with projects, boards, columns, tasks, comments, and activities!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
