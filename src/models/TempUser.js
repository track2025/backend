const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TempUserSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please enter a firstName'],
        },
        lastName: {
            type: String,
            required: [true, 'Please enter a lastName'],
        },
        email: {
            type: String,
            required: [true, 'Please enter an email'],
            unique: true,
        },
        password: {
            type: String,
            select: false,
            required: [true, 'Please enter a password'],
            minlength: 8,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
        },
        phone: {
            type: String,
            maxlength: [20, 'Phone cannot be more than 20 characters.'],
        },
        status: {
            type: String,
        },
        address: {
            type: String,
        },
        city: {
            type: String,
        },
        zip: {
            type: String,
        },
        country: {
            code: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            }
        },
        state: {
            type: String,
        },
        about: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
            required: true,
        },
        lastOtpSentAt: {
            type: Date,
        },
        role: {  // ADD THIS FIELD
            type: String,
            enum: ['super admin', 'admin', 'user', 'vendor'],
            required: true,
            default: 'user'
        },
    },
    {
        timestamps: true,
    }
);

// Hash the password before saving
TempUserSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) {
            return next();
        }

        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        return next();
    } catch (error) {
        return next(error);
    }
});

const TempUser = mongoose.models.TempUser || mongoose.model('TempUser', TempUserSchema);
module.exports = TempUser;