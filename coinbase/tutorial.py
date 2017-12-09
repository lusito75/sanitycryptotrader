import json
from coinbase.wallet.client import Client

api_secret = ""
api_key = ""

secrets = json.load(open("secrets.json"))
for key, secret in secrets.iteritems():
    if key == "api_key":
        api_key = secret
    elif key == "api_secret":
        api_secret = secret

# print "api secret => " +  api_secret + " api key => " + api_key


client = Client(
    api_key,
    api_secret,
    api_version='2017-10-12')

accounts = client.get_accounts()
for account in accounts.data:
    balance = account.balance
    print "%s: %s %s" % (account.name, balance.amount, balance.currency)
    #print account.get_transactions()

primary_account = client.get_primary_account()
balance = primary_account.balance

print "Primary account is: %s: %s %s" % (primary_account.name, balance.amount, balance.currency)

payment_methods = client.get_payment_methods()
# print payment_methods

