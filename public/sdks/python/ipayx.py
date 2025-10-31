"""
iPayX Protocol Python SDK
Official client for interacting with iPayX API
"""

import requests
from typing import Optional, Dict, List, Any


class IpayxClient:
    """Official Python client for iPayX Protocol API."""
    
    def __init__(self, api_key: str, base_url: str = "https://api.ipayx.ai"):
        """
        Initialize iPayX client.
        
        Args:
            api_key: Your iPayX API key (e.g., 'ipx_live_xxx')
            base_url: API base URL (default: https://api.ipayx.ai)
        """
        if not api_key:
            raise ValueError("API key is required")
        
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request to API."""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if not response.ok:
            raise Exception(f"iPayX API error ({response.status_code}): {response.text}")
        
        return response.json()
    
    def quote(
        self,
        from_currency: str,
        to_currency: str,
        amount: float,
        kyc: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Get a quote for a cross-border payment.
        
        Args:
            from_currency: Source currency code (e.g., 'USD')
            to_currency: Destination currency code (e.g., 'CAD')
            amount: Amount to send
            kyc: Whether KYC is required (optional)
        
        Returns:
            Quote response with routes sorted by score
        """
        payload = {
            'from': from_currency,
            'to': to_currency,
            'amount': amount
        }
        if kyc is not None:
            payload['kyc'] = kyc
        
        return self._request('POST', '/v1/quotes', json=payload)
    
    def execute(
        self,
        route_id: str,
        source_account: str,
        dest_account: str,
        amount: float
    ) -> Dict[str, Any]:
        """
        Execute a payment using a selected route.
        
        Args:
            route_id: Rail name from quote response
            source_account: Source account identifier
            dest_account: Destination account identifier
            amount: Amount to send
        
        Returns:
            Payment ID and status
        """
        payload = {
            'routeId': route_id,
            'sourceAccount': source_account,
            'destAccount': dest_account,
            'amount': amount
        }
        
        return self._request('POST', '/v1/execute', json=payload)
    
    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment status by ID.
        
        Args:
            payment_id: Payment identifier
        
        Returns:
            Payment status details
        """
        return self._request('GET', f'/v1/payments/{payment_id}')
    
    def metrics(self) -> Dict[str, Any]:
        """
        Get platform-wide metrics.
        
        Returns:
            Metrics including volume, transactions, fees, etc.
        """
        return self._request('GET', '/v1/metrics')
    
    def status(self) -> Dict[str, Any]:
        """
        Check API health status.
        
        Returns:
            Status, uptime, and version information
        """
        return self._request('GET', '/status')


# Example usage
if __name__ == '__main__':
    # Initialize client
    client = IpayxClient('ipx_live_xxx')
    
    # Get quote
    quote = client.quote(
        from_currency='USD',
        to_currency='CAD',
        amount=10000
    )
    print(f"Best route: {quote['routes'][0]}")
    
    # Execute payment
    payment = client.execute(
        route_id=quote['routes'][0]['rail'],
        source_account='src_account_123',
        dest_account='dst_account_456',
        amount=10000
    )
    print(f"Payment ID: {payment['paymentId']}")
    
    # Check status
    status = client.get_payment(payment['paymentId'])
    print(f"Status: {status['status']}")
