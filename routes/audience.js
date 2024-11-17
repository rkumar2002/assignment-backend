const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Audience = require('../models/Audience');
const moment = require('moment');  // Library for date manipulation

// API to create a new audience segment
router.post('/audience', async (req, res) => {
    const { name, conditions, logic } = req.body;  

    try {
        // Validate input
        if (!name || !conditions || conditions.length === 0 || !logic) {
            return res.status(400).json({ message: 'Invalid input: Missing name, conditions, or logic' });
        }

        // Initialize the query array
        let query = [];

        // Dynamically build the MongoDB query
        conditions.forEach(condition => {
            const { field, operator, value } = condition;  // No more individual 'logic'

            console.log(`Processing condition with field: ${field}, operator: ${operator}, value: ${value}`);

            // Check if the field is "last_visit_date"
            let conditionQuery = {};
            if (field === 'last_visit_date') {
                let currentDate = new Date(); // Get today's date
                let pastDate = new Date(currentDate); 
                pastDate.setMonth(pastDate.getMonth() - months);

                // Build query for date-based comparisons
                conditionQuery[field] = {};
                switch (operator) {
                    case '>':
                        conditionQuery[field]['$lt'] = pastDate;
                        break;
                    case '<':
                        conditionQuery[field]['$gt'] = pastDate;
                        break;
                    case '>=':
                        conditionQuery[field]['$lte'] = pastDate;
                        break;
                    case '<=':
                        conditionQuery[field]['$gte'] = pastDate;
                        break;
                    case '=':
                        conditionQuery[field]['$eq'] = pastDate;
                        break;
                    default:
                        throw new Error(`Unsupported operator: ${operator}`);
                }
            } else {
                // Numeric comparisons like "total_spent"
                conditionQuery[field] = {};
                switch (operator) {
                    case '>':
                        conditionQuery[field]['$gt'] = value;
                        break;
                    case '<':
                        conditionQuery[field]['$lt'] = value;
                        break;
                    case '>=':
                        conditionQuery[field]['$gte'] = value;
                        break;
                    case '<=':
                        conditionQuery[field]['$lte'] = value;
                        break;
                    case '=':
                        conditionQuery[field]['$eq'] = value;
                        break;
                    default:
                        throw new Error(`Unsupported operator: ${operator}`);
                }
            }

            // Add each condition query to the query array
            query.push(conditionQuery);
        });

        // Combine the conditions with the global logic (either 'AND' or 'OR')
        const combinedQuery = logic === 'OR' ? { $or: query } : { $and: query };

        // Execute query to find matching customers
        const matchingCustomers = await Customer.find(combinedQuery).select('name email');
        const segmentSize = matchingCustomers.length;

        // Prepare customer list for the audience segment
        const customers = matchingCustomers.map(customer => ({
            name: customer.name,
            email: customer.email,
        }));

        // Create a new Audience document
        const newAudience = new Audience({
            name,
            conditions,
            size: segmentSize,
            customers,
        });

        await newAudience.save();

        res.status(201).json({
            message: 'Audience segment created successfully',
            audience: newAudience,
        });
    } catch (error) {
        console.error('Error in audience segment calculation :', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/audience/estimate', async (req, res) => {
    const { conditions, logic } = req.body;  // Now 'logic' is global

    try {
        // Validate input
        if (!conditions || conditions.length === 0 || !logic) {
            return res.status(400).json({ message: 'Invalid input: Missing conditions or logic' });
        }

        // Initialize the query array
        let query = [];

        // Dynamically build the MongoDB query based on the conditions provided
        conditions.forEach(condition => {
            const { field, operator, value } = condition; 

            console.log(`Processing condition with field: ${field}, operator: ${operator}, value: ${value}`);

            // Check if the field is "last_visit_date"
            let conditionQuery = {};
            if (field === 'last_visit_date') {
                let currentDate = new Date(); // Get today's date
                let pastDate = new Date(currentDate); 
                pastDate.setMonth(pastDate.getMonth() - months);

                // Build query for date-based comparisons
                conditionQuery[field] = {};
                switch (operator) {
                    case '>':
                        conditionQuery[field]['$lt'] = pastDate;
                        break;
                    case '<':
                        conditionQuery[field]['$gt'] = pastDate;
                        break;
                    case '>=':
                        conditionQuery[field]['$lte'] = pastDate;
                        break;
                    case '<=':
                        conditionQuery[field]['$gte'] = pastDate;
                        break;
                    case '=':
                        conditionQuery[field]['$eq'] = pastDate;
                        break;
                    default:
                        throw new Error(`Unsupported operator: ${operator}`);
                }
            } else {
                // Numeric comparisons like "total_spent"
                conditionQuery[field] = {};
                switch (operator) {
                    case '>':
                        conditionQuery[field]['$gt'] = value;
                        break;
                    case '<':
                        conditionQuery[field]['$lt'] = value;
                        break;
                    case '>=':
                        conditionQuery[field]['$gte'] = value;
                        break;
                    case '<=':
                        conditionQuery[field]['$lte'] = value;
                        break;
                    case '=':
                        conditionQuery[field]['$eq'] = value;
                        break;
                    default:
                        throw new Error(`Unsupported operator: ${operator}`);
                }
            }

            // Add each condition query to the query array
            query.push(conditionQuery);
        });

        // Combine the conditions with the global logic (either 'AND' or 'OR')
        const combinedQuery = logic === 'OR' ? { $or: query } : { $and: query };

        // Execute query to find matching customers
        const matchingCustomers = await Customer.find(combinedQuery);
        const segmentSize = matchingCustomers.length;

        res.status(200).json({ size : segmentSize });

    } catch (error) {
        console.error('Error previewing audience size :', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/audience', async (req, res) => {
    try {
      // Find all audience segments in the database
      const audiences = await Audience.find();
        
      // Map over the audiences to only send relevant information to the frontend
      const response = audiences.map(audience => ({
        id : audience._id,
        name: audience.name,
        conditions: audience.conditions.map(cond => `${cond.field} ${cond.operator} ${cond.value}`).join(', '), // For example, "total_spent > 10000, visits <= 3"
        size: audience.size,
        customers : audience.customers,
      }));
  
      // Send the response back to the frontend
      res.json(response);
    } catch (error) {
      console.error('Error fetching audience segments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


module.exports = router;
