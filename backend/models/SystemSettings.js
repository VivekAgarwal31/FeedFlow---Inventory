import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
    // Singleton pattern - only one document should exist
    _id: {
        type: String,
        default: 'system_settings'
    },

    // Google Authentication
    googleLoginEnabled: {
        type: Boolean,
        default: false
    },
    googleOneTapEnabled: {
        type: Boolean,
        default: false
    },

    // Microsoft Authentication
    microsoftLoginEnabled: {
        type: Boolean,
        default: false
    },
    microsoftOneTapEnabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Static method to get or create settings
systemSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findById('system_settings');

    if (!settings) {
        settings = await this.create({ _id: 'system_settings' });
    }

    return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function (updates) {
    let settings = await this.getSettings();

    Object.assign(settings, updates);
    await settings.save();

    return settings;
};

export default mongoose.model('SystemSettings', systemSettingsSchema);
