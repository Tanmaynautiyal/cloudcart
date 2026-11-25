from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class PaymentBase(BaseModel):
    order_id: int
    payment_method: str = "Credit Card"
    amount: Decimal = Field(..., gt=0)
    currency: str = "USD"
    payment_gateway: Optional[str] = "CloudCartPay"


class PaymentCreate(PaymentBase):
    pass


class PaymentProcessRequest(BaseModel):
    order_id: int = Field(..., gt=0, description="Order ID to pay for")
    payment_method: str = Field("Credit Card", description="Payment method: Credit Card, PayPal, COD, etc.")
    card_token: Optional[str] = Field("tok_mock_card_4242", description="Simulated payment token or nonce")


class PaymentWebhookPayload(BaseModel):
    event: str = Field(..., description="Webhook event type: payment.succeeded, payment.failed, payment.refunded")
    transaction_id: str = Field(..., description="Unique gateway transaction ID")
    order_id: int = Field(..., gt=0, description="Target Order ID")
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    currency: str = Field("USD", description="Currency code")
    status: str = Field("COMPLETED", description="COMPLETED, FAILED, REFUNDED")
    signature: Optional[str] = Field(None, description="HMAC or gateway signature for verification")
    metadata: Optional[Dict[str, Any]] = None


class PaymentWebhookResponse(BaseModel):
    received: bool = True
    status: str
    transaction_id: str
    message: str


class PaymentResponse(PaymentBase):
    id: int
    user_id: int
    transaction_id: Optional[str] = None
    status: str
    gateway_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
