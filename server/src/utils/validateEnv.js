/**
 * Environment Variable Validation Utility
 * Validates and provides helpful error messages for missing environment variables
 */

const chalk = require('chalk');

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate a required environment variable
   * @param {string} name - Environment variable name
   * @param {string} description - Human-readable description
   * @param {string} example - Example value
   */
  required(name, description, example = '') {
    const value = process.env[name];
    
    if (!value || value.trim() === '') {
      this.errors.push({
        name,
        description,
        example,
        type: 'required'
      });
    }
    
    return value;
  }

  /**
   * Validate an optional environment variable with default
   * @param {string} name - Environment variable name
   * @param {any} defaultValue - Default value if not set
   * @param {string} description - Human-readable description
   */
  optional(name, defaultValue, description = '') {
    const value = process.env[name];
    
    if (!value) {
      this.warnings.push({
        name,
        defaultValue,
        description,
        type: 'optional'
      });
      return defaultValue;
    }
    
    return value;
  }

  /**
   * Validate a numeric environment variable
   * @param {string} name - Environment variable name
   * @param {number} defaultValue - Default value
   * @param {string} description - Human-readable description
   */
  number(name, defaultValue, description = '') {
    const value = process.env[name];
    
    if (!value) {
      this.warnings.push({
        name,
        defaultValue,
        description,
        type: 'optional'
      });
      return defaultValue;
    }
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      this.errors.push({
        name,
        description: `${description} (must be a number)`,
        example: defaultValue.toString(),
        type: 'invalid'
      });
      return defaultValue;
    }
    
    return numValue;
  }

  /**
   * Validate a boolean environment variable
   * @param {string} name - Environment variable name
   * @param {boolean} defaultValue - Default value
   * @param {string} description - Human-readable description
   */
  boolean(name, defaultValue, description = '') {
    const value = process.env[name];
    
    if (!value) {
      return defaultValue;
    }
    
    const lowerValue = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
      return true;
    }
    
    if (['false', '0', 'no', 'off'].includes(lowerValue)) {
      return false;
    }
    
    this.warnings.push({
      name,
      defaultValue,
      description: `${description} (invalid boolean value: ${value})`,
      type: 'invalid'
    });
    
    return defaultValue;
  }

  /**
   * Validate URL format
   * @param {string} name - Environment variable name
   * @param {string} defaultValue - Default value
   * @param {string} description - Human-readable description
   */
  url(name, defaultValue, description = '') {
    const value = process.env[name] || defaultValue;
    
    try {
      new URL(value);
      return value;
    } catch (error) {
      this.errors.push({
        name,
        description: `${description} (invalid URL format)`,
        example: defaultValue,
        type: 'invalid'
      });
      return defaultValue;
    }
  }

  /**
   * Display validation results and exit if errors found
   */
  validate() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Display warnings
    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Environment Variable Warnings:'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning.name}: ${warning.description || 'Using default value'}`));
        if (warning.defaultValue !== undefined) {
          console.log(chalk.gray(`     Default: ${warning.defaultValue}`));
        }
      });
    }

    // Display errors
    if (this.errors.length > 0) {
      console.log(chalk.red('\n❌ Missing Required Environment Variables:'));
      
      this.errors.forEach(error => {
        console.log(chalk.red(`   • ${error.name}: ${error.description}`));
        if (error.example) {
          console.log(chalk.gray(`     Example: ${error.example}`));
        }
      });

      console.log(chalk.yellow('\n💡 How to fix:'));
      console.log(chalk.yellow('   1. Copy .env.example to .env'));
      console.log(chalk.yellow('   2. Fill in the required values'));
      console.log(chalk.yellow('   3. Restart your application'));
      
      console.log(chalk.blue('\n📖 For detailed setup instructions:'));
      console.log(chalk.blue('   See docs/ENVIRONMENT_SETUP.md'));

      if (isProduction) {
        console.log(chalk.red('\n🚨 Production environment detected. Exiting due to missing variables.'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('\n⚠️  Development mode: Continuing with warnings...'));
      }
    } else if (this.warnings.length === 0) {
      console.log(chalk.green('✅ All environment variables validated successfully!'));
    }
  }

  /**
   * Get environment summary for debugging
   */
  getSummary() {
    return {
      nodeEnv: process.env.NODE_ENV,
      hasRequiredVars: this.errors.length === 0,
      warningCount: this.warnings.length,
      errorCount: this.errors.length,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

module.exports = EnvironmentValidator;