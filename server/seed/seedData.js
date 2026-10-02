const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrms_lite';

const departmentsData = [
  { name: 'Engineering', description: 'Software development, infrastructure, and technical design.' },
  { name: 'Human Resources', description: 'Talent acquisition, employee relations, and HR operations.' },
  { name: 'Finance', description: 'Financial planning, accounting, and payroll management.' },
  { name: 'Marketing', description: 'Brand strategy, content creation, and digital marketing.' },
  { name: 'Sales', description: 'Business development, client relationships, and sales pipeline.' }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await Department.deleteMany({});
    await Employee.deleteMany({});
    await Attendance.deleteMany({});
    console.log('Cleared existing database collections.');

    // Insert Departments
    const createdDepts = await Department.insertMany(departmentsData);
    console.log(`Seeded ${createdDepts.length} departments.`);

    const deptMap = {};
    createdDepts.forEach((d) => {
      deptMap[d.name] = d._id;
    });

    // 10 Sample Employees
    const employeesData = [
      {
        employeeId: 'EMP001',
        fullName: 'John Doe',
        email: 'john.doe@company.com',
        department: deptMap['Engineering'],
        designation: 'Senior Full Stack Engineer',
        gender: 'Male',
        phone: '+1-555-0101',
        address: '123 Tech Park, San Francisco, CA',
        hireDate: new Date('2023-01-15'),
        isActive: true
      },
      {
        employeeId: 'EMP002',
        fullName: 'Jane Smith',
        email: 'jane.smith@company.com',
        department: deptMap['Human Resources'],
        designation: 'HR Specialist',
        gender: 'Female',
        phone: '+1-555-0102',
        address: '456 Corporate Way, Austin, TX',
        hireDate: new Date('2023-03-20'),
        isActive: true
      },
      {
        employeeId: 'EMP003',
        fullName: 'Michael Brown',
        email: 'michael.brown@company.com',
        department: deptMap['Engineering'],
        designation: 'Backend Developer',
        gender: 'Male',
        phone: '+1-555-0103',
        address: '789 Innovation Ave, Seattle, WA',
        hireDate: new Date('2023-06-01'),
        isActive: true
      },
      {
        employeeId: 'EMP004',
        fullName: 'Emily Davis',
        email: 'emily.davis@company.com',
        department: deptMap['Finance'],
        designation: 'Financial Analyst',
        gender: 'Female',
        phone: '+1-555-0104',
        address: '101 Wall Street, New York, NY',
        hireDate: new Date('2023-08-10'),
        isActive: true
      },
      {
        employeeId: 'EMP005',
        fullName: 'Robert Wilson',
        email: 'robert.wilson@company.com',
        department: deptMap['Marketing'],
        designation: 'Marketing Manager',
        gender: 'Male',
        phone: '+1-555-0105',
        address: '202 Creative Blvd, Chicago, IL',
        hireDate: new Date('2023-11-05'),
        isActive: true
      },
      {
        employeeId: 'EMP006',
        fullName: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        department: deptMap['Sales'],
        designation: 'Sales Executive',
        gender: 'Female',
        phone: '+1-555-0106',
        address: '303 Commerce St, Boston, MA',
        hireDate: new Date('2024-01-10'),
        isActive: true
      },
      {
        employeeId: 'EMP007',
        fullName: 'David Lee',
        email: 'david.lee@company.com',
        department: deptMap['Engineering'],
        designation: 'DevOps Engineer',
        gender: 'Male',
        phone: '+1-555-0107',
        address: '404 Cloud Rd, San Jose, CA',
        hireDate: new Date('2024-02-15'),
        isActive: true
      },
      {
        employeeId: 'EMP008',
        fullName: 'Amanda Taylor',
        email: 'amanda.taylor@company.com',
        department: deptMap['Human Resources'],
        designation: 'Recruiter',
        gender: 'Female',
        phone: '+1-555-0108',
        address: '505 Talent Way, Denver, CO',
        hireDate: new Date('2024-04-01'),
        isActive: true
      },
      {
        employeeId: 'EMP009',
        fullName: 'James Anderson',
        email: 'james.anderson@company.com',
        department: deptMap['Sales'],
        designation: 'Account Executive',
        gender: 'Male',
        phone: '+1-555-0109',
        address: '606 Growth Lane, Atlanta, GA',
        hireDate: new Date('2024-05-20'),
        isActive: true
      },
      {
        employeeId: 'EMP010',
        fullName: 'Lisa Thomas',
        email: 'lisa.thomas@company.com',
        department: deptMap['Finance'],
        designation: 'Senior Accountant',
        gender: 'Female',
        phone: '+1-555-0110',
        address: '707 Audit St, Dallas, TX',
        hireDate: new Date('2024-07-12'),
        isActive: false // Sample inactive employee to test inactive logic
      }
    ];

    const createdEmployees = await Employee.insertMany(employeesData);
    console.log(`Seeded ${createdEmployees.length} employees.`);

    // Seed Attendance for recent dates (e.g. last 5 working days)
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      dates.push(utcDate);
    }

    const attendanceRecords = [];
    const activeEmps = createdEmployees.filter((e) => e.isActive);

    const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent'];
    const remarksOptions = {
      Present: 'On time',
      Late: 'Traffic delay (15 mins late)',
      Absent: 'Sick leave requested'
    };

    activeEmps.forEach((emp, empIdx) => {
      dates.forEach((date, dateIdx) => {
        // Pick status deterministically so seed data is consistent
        const statusIdx = (empIdx + dateIdx) % statuses.length;
        const status = statuses[statusIdx];
        attendanceRecords.push({
          employee: emp._id,
          date,
          status,
          remarks: remarksOptions[status]
        });
      });
    });

    const createdAttendance = await Attendance.insertMany(attendanceRecords);
    console.log(`Seeded ${createdAttendance.length} attendance records.`);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
