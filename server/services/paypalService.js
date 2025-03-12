const paypal = require('@paypal/checkout-server-sdk');
const config = require('../config/config');

class PayPalService {
  constructor() {
    this.clientId = config.paypal.clientId;
    this.clientSecret = config.paypal.clientSecret;
    this.environment = this.getEnvironment();
    this.client = new paypal.core.PayPalHttpClient(this.environment);
  }

  getEnvironment() {
    if (config.paypal.mode === 'production') {
      return new paypal.core.LiveEnvironment(
        this.clientId,
        this.clientSecret
      );
    }
    return new paypal.core.SandboxEnvironment(
      this.clientId,
      this.clientSecret
    );
  }

  // Create a one-time payment
  async createOrder(amount, currency = 'USD', description) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
          description: description,
        },
      ],
      application_context: {
        brand_name: 'SkyVPS360',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.APP_URL}/payment/success`,
        cancel_url: `${process.env.APP_URL}/payment/cancel`,
      },
    });

    try {
      const order = await this.client.execute(request);
      return order.result;
    } catch (err) {
      console.error('PayPal create order error:', err);
      throw new Error('Failed to create PayPal order');
    }
  }

  // Capture payment for an order
  async capturePayment(orderId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await this.client.execute(request);
      return capture.result;
    } catch (err) {
      console.error('PayPal capture payment error:', err);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  // Create a subscription plan
  async createPlan(planDetails) {
    const { name, description, billingInterval, price, currency = 'USD' } = planDetails;
    
    let billingCycles;
    
    switch (billingInterval) {
      case 'monthly':
        billingCycles = [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: price.toString(),
                currency_code: currency,
              },
            },
          },
        ];
        break;
      case 'quarterly':
        billingCycles = [
          {
            frequency: {
              interval_unit: 'MONTH',
              interval_count: 3,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: price.toString(),
                currency_code: currency,
              },
            },
          },
        ];
        break;
      case 'annual':
        billingCycles = [
          {
            frequency: {
              interval_unit: 'YEAR',
              interval_count: 1,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: price.toString(),
                currency_code: currency,
              },
            },
          },
        ];
        break;
      default:
        throw new Error('Invalid billing interval');
    }

    const planRequest = {
      name,
      description,
      product_id: process.env.PAYPAL_PRODUCT_ID, // You'll need to create this first
      billing_cycles: billingCycles,
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: currency,
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    };

    try {
      const response = await this.client.execute(new paypal.billingPlans.PlansCreateRequest().requestBody(planRequest));
      return response.result;
    } catch (err) {
      console.error('PayPal create plan error:', err);
      throw new Error('Failed to create PayPal plan');
    }
  }

  // Create a subscription for a user
  async createSubscription(planId) {
    const subscriptionRequest = {
      plan_id: planId,
      application_context: {
        brand_name: 'SkyVPS360',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
        return_url: `${process.env.APP_URL}/subscription/success`,
        cancel_url: `${process.env.APP_URL}/subscription/cancel`,
      },
    };

    try {
      const response = await this.client.execute(new paypal.subscriptions.SubscriptionsCreateRequest().requestBody(subscriptionRequest));
      return response.result;
    } catch (err) {
      console.error('PayPal create subscription error:', err);
      throw new Error('Failed to create PayPal subscription');
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId, reason = 'Not specified') {
    const request = new paypal.subscriptions.SubscriptionsCancelRequest(subscriptionId);
    request.requestBody({ reason });

    try {
      const response = await this.client.execute(request);
      return response.result;
    } catch (err) {
      console.error('PayPal cancel subscription error:', err);
      throw new Error('Failed to cancel PayPal subscription');
    }
  }

  // Get subscription details
  async getSubscriptionDetails(subscriptionId) {
    const request = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);

    try {
      const response = await this.client.execute(request);
      return response.result;
    } catch (err) {
      console.error('PayPal get subscription error:', err);
      throw new Error('Failed to get PayPal subscription details');
    }
  }
}

module.exports = new PayPalService();