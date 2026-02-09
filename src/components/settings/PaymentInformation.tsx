"use client"

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Trash2, Calendar, Download, Filter, CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

interface StripeAccount {
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  balance?: {
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  };
  email?: string;
  country?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  arrivalDate?: string;
  metadata?: any;
}

export default function PaymentInformation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stripeAccount, setStripeAccount] = useState<StripeAccount>({ connected: false });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionFilter, setTransactionFilter] = useState("all");

  // Client payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [connectingStripe, setConnectingStripe] = useState(false);
  
  // Withdrawal state
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  useEffect(() => {
    if (user?.role === 'freelancer') {
      fetchStripeAccount();
      fetchTransactions();
    } else if (user?.role === 'client') {
      fetchPaymentMethods();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStripeAccount = async () => {
    try {
      const response = await fetch('/api/stripe/connect');
      const data = await response.json();
      setStripeAccount(data);
    } catch (error) {
      console.error('Error fetching Stripe account:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/stripe/transactions?limit=20');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect', { method: 'POST' });
      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.url;
      } else {
        toast.error('Failed to initialize Stripe Connect');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to connect Stripe account');
      setLoading(false);
    }
  };

  // Client payment methods functions
  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/payment-method');
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePaymentMethods = async () => {
    try {
      setConnectingStripe(true);
      const response = await fetch('/api/stripe/customer-portal', { method: 'POST' });
      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        toast.error('Failed to open payment management portal');
      }
    } catch (error) {
      console.error('Error opening Stripe portal:', error);
      toast.error('Failed to connect to Stripe');
      setConnectingStripe(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilter === "all") return true;
    return transaction.type === transactionFilter;
  });

  const getAvailableBalance = () => {
    if (!stripeAccount.balance?.available) return 0;
    return stripeAccount.balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
  };

  const getPendingBalance = () => {
    if (!stripeAccount.balance?.pending) return 0;
    return stripeAccount.balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* For Freelancers - Stripe Connect */}
      {user?.role === 'freelancer' && (
        <>
          {!stripeAccount.connected ? (
            /* Stripe Connect Onboarding */
            <Card className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Bank Account</h2>
                <p className="text-gray-600 mb-6">
                  Connect your bank account with Stripe to receive payments securely and get paid faster.
                </p>
                <Button 
                  onClick={handleConnectStripe}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect with Stripe
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Powered by Stripe • Secure and encrypted
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Stripe Account Status */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Stripe Account</h2>
                  {stripeAccount.detailsSubmitted ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Setup Incomplete</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Account ID</p>
                      <p className="font-mono text-sm">{stripeAccount.accountId}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="text-sm">{stripeAccount.email || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Charges Enabled</p>
                      <p className="font-medium">{stripeAccount.chargesEnabled ? '✓ Yes' : '✗ No'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Payouts Enabled</p>
                      <p className="font-medium">{stripeAccount.payoutsEnabled ? '✓ Yes' : '✗ No'}</p>
                    </div>
                  </div>

                  {!stripeAccount.detailsSubmitted && (
                    <Button onClick={handleConnectStripe} variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Complete Stripe Setup
                    </Button>
                  )}
                </div>
              </Card>

              {/* Withdrawal Settings */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Withdraw Funds</h2>
                
                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                      <h3 className="text-sm font-medium text-green-800 mb-1">Available Balance</h3>
                      <p className="text-3xl font-bold text-green-900">${getAvailableBalance().toFixed(2)}</p>
                      <p className="text-xs text-green-700 mt-1">Ready to withdraw</p>
                    </div>
                    <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800 mb-1">Pending Balance</h3>
                      <p className="text-3xl font-bold text-blue-900">${getPendingBalance().toFixed(2)}</p>
                      <p className="text-xs text-blue-700 mt-1">Processing</p>
                    </div>
                  </div>

                  {/* Withdrawal Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Withdrawal Amount (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                        <input
                          type="number"
                          value={withdrawalAmount}
                          onChange={(e) => setWithdrawalAmount(e.target.value)}
                          min={50}
                          max={getAvailableBalance()}
                          step={0.01}
                          placeholder="50.00"
                          className="w-full pl-8 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Minimum: $50.00 • Maximum: ${getAvailableBalance().toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Balance Display - Auto-transferred by Stripe */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Balance & Payouts</h2>
                
                <div className="space-y-6">
                  {/* Balance Display */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 border-2 border-green-200 bg-green-50 rounded-lg">
                      <h3 className="text-sm font-medium text-green-800 mb-1">Available Balance</h3>
                      <p className="text-3xl font-bold text-green-900">${getAvailableBalance().toFixed(2)}</p>
                      <p className="text-xs text-green-700 mt-1">Auto-transferred to bank</p>
                    </div>
                    <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-800 mb-1">Pending Balance</h3>
                      <p className="text-3xl font-bold text-blue-900">${getPendingBalance().toFixed(2)}</p>
                      <p className="text-xs text-blue-700 mt-1">Processing</p>
                    </div>
                  </div>

                  {/* Auto-Payout Info */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Automatic Payouts Enabled</h4>
                        <p className="text-sm text-blue-800">
                          Stripe automatically transfers your earnings to your bank account within 2 business days after each payment release. 
                          No manual withdrawal needed!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payout Schedule</p>
                      <p className="text-sm text-gray-600">Daily automatic transfers (2 business days)</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-4">
                    Powered by Stripe • Secure and encrypted
                  </p>
                </div>
              </Card>
            </>
          )}

          {/* Payment Methods Section */}
          {paymentMethods.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
                <Button 
                  onClick={handleManagePaymentMethods}
                  disabled={connectingStripe}
                  variant="outline"
                >
                  {connectingStripe ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage with Stripe
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">
                          {method.card?.brand?.toUpperCase() || 'Card'} •••• {method.card?.last4}
                        </h3>
                        {method.isDefault && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Expires {method.card?.exp_month}/{method.card?.exp_year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Click "Manage with Stripe" to add, remove, or set default payment methods in Stripe's secure portal.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Transaction History (for both) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select 
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
            >
              <option value="all">All Transactions</option>
              {user?.role === 'freelancer' ? (
                <>
                  <option value="payment_received">Payments Received</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="fee">Fees</option>
                </>
              ) : (
                <>
                  <option value="payment_sent">Payments Sent</option>
                  <option value="refund">Refunds</option>
                  <option value="fee">Fees</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${
                transaction.amount < 0 ? 'bg-red-100' : 
                transaction.status === 'pending' ? 'bg-yellow-100' : 
                'bg-green-100'
              }`}>
                {transaction.amount < 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-red-600" />
                ) : (
                  <ArrowDownLeft className={`w-5 h-5 ${
                    transaction.status === 'pending' ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                  <span className="text-gray-400">•</span>
                  <span className={`text-sm px-2 py-0.5 rounded-full ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-lg font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                {transaction.invoiceId && (
                  <button
                    onClick={() => downloadInvoice(transaction.invoiceId)}
                    className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Invoice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          <Button variant="outline">View All</Button>
        </div>
      </Card>

      {/* Billing History Download */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Export History</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 mb-1">Download your complete transaction history</p>
            <p className="text-sm text-gray-500">Export as CSV or PDF for your records</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
