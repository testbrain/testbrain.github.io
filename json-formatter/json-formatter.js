(function () {
    'use strict';

    const input = document.getElementById('jsonInput');
    const formatBtn = document.getElementById('formatBtn');
    const sampleBtn = document.getElementById('sampleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const errorBox = document.getElementById('errorBox');
    const toast = document.getElementById('toast');

    const SAMPLE = { "employees": [{ "id": 1, "name": "Alice Johnson", "position": "Software Engineer", "department": "Engineering", "salary": 85000, "contact": { "email": "alice.j@company.com", "phone": "+1-555-0101", "address": { "street": "101 Tech Park", "city": "San Francisco", "state": "CA", "zip": "94105" } }, "skills": ["React", "Node.js", "TypeScript"], "projects": [{ "name": "Dashboard Redesign", "status": "completed" }, { "name": "API Gateway", "status": "in-progress" }], "isActive": true }, { "id": 2, "name": "Bob Smith", "position": "Product Manager", "department": "Product", "salary": 92000, "contact": { "email": "bob.s@company.com", "phone": "+1-555-0102", "address": { "street": "202 Market St", "city": "San Francisco", "state": "CA", "zip": "94103" } }, "skills": ["Agile", "Jira", "Product Strategy"], "projects": [{ "name": "Mobile App Launch", "status": "completed" }, { "name": "User Research", "status": "planning" }], "isActive": true }, { "id": 3, "name": "Carol White", "position": "UX Designer", "department": "Design", "salary": 78000, "contact": { "email": "carol.w@company.com", "phone": "+1-555-0103", "address": { "street": "303 Creative Blvd", "city": "Oakland", "state": "CA", "zip": "94607" } }, "skills": ["Figma", "Sketch", "User Testing"], "projects": [{ "name": "Design System", "status": "in-progress" }, { "name": "Onboarding Flow", "status": "completed" }], "isActive": false }, { "id": 4, "name": "David Lee", "position": "DevOps Engineer", "department": "Infrastructure", "salary": 95000, "contact": { "email": "david.l@company.com", "phone": "+1-555-0104", "address": { "street": "404 Cloud Ave", "city": "San Jose", "state": "CA", "zip": "95110" } }, "skills": ["Docker", "Kubernetes", "AWS"], "projects": [{ "name": "CI/CD Pipeline", "status": "completed" }, { "name": "Cloud Migration", "status": "in-progress" }], "isActive": true }, { "id": 5, "name": "Eva Martinez", "position": "Data Analyst", "department": "Data Science", "salary": 82000, "contact": { "email": "eva.m@company.com", "phone": "+1-555-0105", "address": { "street": "505 Data Lane", "city": "Berkeley", "state": "CA", "zip": "94704" } }, "skills": ["Python", "SQL", "Tableau"], "projects": [{ "name": "Sales Dashboard", "status": "completed" }, { "name": "Customer Segmentation", "status": "planning" }], "isActive": true }, { "id": 6, "name": "Frank Wilson", "position": "Backend Developer", "department": "Engineering", "salary": 88000, "contact": { "email": "frank.w@company.com", "phone": "+1-555-0106", "address": { "street": "606 Server Rd", "city": "Palo Alto", "state": "CA", "zip": "94301" } }, "skills": ["Java", "Spring Boot", "PostgreSQL"], "projects": [{ "name": "Payment Service", "status": "in-progress" }, { "name": "Order System", "status": "completed" }], "isActive": false }, { "id": 7, "name": "Grace Kim", "position": "Frontend Developer", "department": "Engineering", "salary": 84000, "contact": { "email": "grace.k@company.com", "phone": "+1-555-0107", "address": { "street": "707 UI Street", "city": "Mountain View", "state": "CA", "zip": "94040" } }, "skills": ["Vue.js", "Tailwind CSS", "GraphQL"], "projects": [{ "name": "Admin Panel", "status": "completed" }, { "name": "Landing Page", "status": "in-progress" }], "isActive": true }, { "id": 8, "name": "Henry Patel", "position": "QA Engineer", "department": "Quality Assurance", "salary": 72000, "contact": { "email": "henry.p@company.com", "phone": "+1-555-0108", "address": { "street": "808 Test Blvd", "city": "Sunnyvale", "state": "CA", "zip": "94086" } }, "skills": ["Selenium", "JUnit", "Cypress"], "projects": [{ "name": "Automation Suite", "status": "in-progress" }, { "name": "Performance Testing", "status": "planning" }], "isActive": true }, { "id": 9, "name": "Irene Zhao", "position": "Business Analyst", "department": "Product", "salary": 79000, "contact": { "email": "irene.z@company.com", "phone": "+1-555-0109", "address": { "street": "909 Strategy Way", "city": "San Mateo", "state": "CA", "zip": "94401" } }, "skills": ["SQL", "Excel", "PowerBI"], "projects": [{ "name": "Market Research", "status": "completed" }, { "name": "ROI Analysis", "status": "in-progress" }], "isActive": false }, { "id": 10, "name": "Jack Thompson", "position": "Machine Learning Engineer", "department": "Data Science", "salary": 105000, "contact": { "email": "jack.t@company.com", "phone": "+1-555-0110", "address": { "street": "1010 AI Drive", "city": "San Francisco", "state": "CA", "zip": "94102" } }, "skills": ["TensorFlow", "PyTorch", "Scikit-learn"], "projects": [{ "name": "Recommendation Engine", "status": "in-progress" }, { "name": "Chatbot Development", "status": "planning" }], "isActive": true }], "metadata": { "totalEmployees": 10, "departments": ["Engineering", "Product", "Design", "Infrastructure", "Data Science", "Quality Assurance"], "generatedDate": "2026-09-07T12:00:00Z", "version": "1.0" } };

    let toastTimeout = null;
    function showToast(message) {
        toast.textContent = message;
        toast.className = 'toast';
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.add('visible');
    }

    function clearError() {
        errorBox.textContent = '';
        errorBox.classList.remove('visible');
    }

    formatBtn.addEventListener('click', () => {
        const raw = input.value.trim();
        clearError();

        if (!raw) {
            showError('⚠️ Paste some JSON first.');
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            localStorage.setItem('devtools-json-data', JSON.stringify(parsed));
            window.open('json-viewer.html', '_blank');
        } catch (err) {
            showError('❌ Invalid JSON: ' + err.message);
        }
    });

    sampleBtn.addEventListener('click', () => {
        input.value = JSON.stringify(SAMPLE, null, 2);
        clearError();
        showToast('📄 Sample JSON loaded');
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearError();
        input.focus();
    });

})();
