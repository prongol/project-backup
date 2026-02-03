"use client"

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, Trash2, DollarSign, Calendar, Download, Filter, CheckCircle2, AlertCircle, Loader2, ExternalLink } from "lucide-react";
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
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");

  useEffect(() => {
    if (user?.role === 'freelancer') {
      fetchStripeAccount();
      fetchTransactions();
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

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawalAmount);
    
    if (!amount || amount < 50) {
      toast.error('Minimum withdrawal amount is $50');
      return;
    }

    const availableBalance = stripeAccount.balance?.available.reduce((sum, b) => sum + b.amount, 0) || 0;
    
    if (amount * 100 > availableBalance) {
      toast.error('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/stripe/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Withdrawal of $${amount} initiated successfully!`);
        setWithdrawalAmount("");
        await fetchStripeAccount();
        await fetchTransactions();
      } else {
        toast.error(data.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
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

                    <Button 
                      onClick={handleWithdraw} 
                      disabled={withdrawing || !stripeAccount.payoutsEnabled || getAvailableBalance() < 50}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      {withdrawing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Withdraw to Bank
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Funds typically arrive in 2-3 business days
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* For Clients - Payment Methods */}
      {user?.role === 'client' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
            <Button onClick={handleAddCard} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Card
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
                      {method.type} •••• {method.last4}
                    </h3>
                    {method.isDefault && (
                      <span className="px-2 py-0.5 bg-[#0CF574]/20 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                </div>

                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button 
                      onClick={() => handleSetDefaultCard(method.id)}
                      variant="outline" 
                      size="sm"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button 
                    onClick={() => handleDeleteCard(method.id)}
                    variant="outline" 
                    size="sm"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Card Form */}
          {isAddingCard && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-4">Add New Card</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0CF574] focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="setDefault" className="rounded" />
                  <label htmlFor="setDefault" className="text-sm text-gray-700">
                    Set as default payment method
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button className="bg-foreground hover:bg-gray-800">Add Card</Button>
                  <Button onClick={() => setIsAddingCard(false)} variant="outline">Cancel</Button>
                </div>
              </div>
            </div>
          )}
        </Card>
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
                <DollarSign className={`w-5 h-5 ${
                  transaction.amount < 0 ? 'text-red-600' : 
                  transaction.status === 'pending' ? 'text-yellow-600' : 
                  'text-green-600'
                }`} />
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
