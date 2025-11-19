#!/usr/bin/env python3
"""
FINTRAC ECTR XML Generator (Back-office Script)
Generates Electronic Cash Transaction Report XML files for FINTRAC compliance
Usage: python generate_fintrac_ectr.py --sender-id USER123 --amount 15000 --country CA
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape


def build_fintrac_ectr_xml(
    sender_id: str,
    amount_cad: float,
    receiver_country: str,
    kyc: dict,
    add_comment: str = None
) -> str:
    """
    Build FINTRAC ECTR XML string.
    
    Args:
        sender_id: Unique identifier for the sender
        amount_cad: Transaction amount in CAD
        receiver_country: ISO country code of receiver
        kyc: Dictionary with sender_name, address, dob
        add_comment: Optional comment to add to XML
        
    Returns:
        XML string
    """
    today = datetime.now().strftime('%Y-%m-%d')
    comment = f"  <!-- {escape(add_comment)} -->\n" if add_comment else ""
    
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<ECTR>
{comment}  <TransactionDate>{today}</TransactionDate>
  <Amount>{amount_cad}</Amount>
  <SenderName>{escape(kyc.get('sender_name', ''))}</SenderName>
  <SenderID>{escape(sender_id)}</SenderID>
  <SenderAddress>{escape(kyc.get('address', ''))}</SenderAddress>
  <SenderDOB>{escape(kyc.get('dob', ''))}</SenderDOB>
  <ReceiverCountry>{escape(receiver_country)}</ReceiverCountry>
</ECTR>
"""
    return xml


def safe_filename(sender_id: str) -> str:
    """Generate safe filename from sender ID."""
    safe_id = ''.join(c if c.isalnum() or c in '._-' else '_' for c in sender_id)
    return safe_id or 'sender'


def write_fintrac_file(xml: str, sender_id: str, output_dir: str = None) -> dict:
    """
    Write FINTRAC XML to file.
    
    Args:
        xml: XML content to write
        sender_id: Sender identifier for filename
        output_dir: Optional output directory (default: ./.tmp/fintrac or /tmp/fintrac)
        
    Returns:
        Dictionary with file metadata
    """
    if output_dir:
        base_dir = Path(output_dir)
    else:
        # Use /tmp/fintrac if /tmp exists, otherwise use ./.tmp/fintrac
        if Path('/tmp').exists():
            base_dir = Path('/tmp/fintrac')
        else:
            base_dir = Path.cwd() / '.tmp' / 'fintrac'
    
    base_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"ectr_report_{safe_filename(sender_id)}_{timestamp}.xml"
    filepath = base_dir / filename
    
    filepath.write_text(xml, encoding='utf-8')
    
    return {
        'fileName': filename,
        'absPath': str(filepath.absolute()),
        'sizeBytes': len(xml.encode('utf-8'))
    }


def main():
    """Main entry point for CLI usage."""
    parser = argparse.ArgumentParser(
        description='Generate FINTRAC ECTR XML files for compliance reporting'
    )
    parser.add_argument('--sender-id', required=True, help='Sender unique identifier')
    parser.add_argument('--amount', type=float, required=True, help='Amount in CAD')
    parser.add_argument('--country', required=True, help='Receiver country code (e.g., CA, US)')
    parser.add_argument('--sender-name', default='John Doe', help='Sender full name')
    parser.add_argument('--address', default='123 Main St, Toronto, ON', help='Sender address')
    parser.add_argument('--dob', default='1990-01-01', help='Sender date of birth (YYYY-MM-DD)')
    parser.add_argument('--output-dir', help='Output directory for XML file')
    parser.add_argument('--dry-run', action='store_true', help='Add DRY_RUN comment to XML')
    parser.add_argument('--force', action='store_true', help='Force generation even below threshold')
    
    args = parser.parse_args()
    
    # Check threshold
    THRESHOLD = 10000
    if not args.force and args.amount < THRESHOLD:
        print(f"Amount {args.amount} CAD is below threshold of {THRESHOLD} CAD", file=sys.stderr)
        print(f"Use --force to generate anyway", file=sys.stderr)
        sys.exit(1)
    
    # Build KYC dict
    kyc = {
        'sender_name': args.sender_name,
        'address': args.address,
        'dob': args.dob
    }
    
    # Get DRY_RUN setting
    dry_run = args.dry_run or os.environ.get('DRY_RUN', 'true').lower() != 'false'
    
    # Generate XML
    comment = "DRY_RUN — not submitted" if dry_run else None
    xml = build_fintrac_ectr_xml(
        args.sender_id,
        args.amount,
        args.country,
        kyc,
        comment
    )
    
    # Write file
    file_info = write_fintrac_file(xml, args.sender_id, args.output_dir)
    
    # Print results
    print(f"✓ FINTRAC ECTR generated successfully")
    print(f"  File: {file_info['fileName']}")
    print(f"  Path: {file_info['absPath']}")
    print(f"  Size: {file_info['sizeBytes']} bytes")
    print(f"  DRY_RUN: {dry_run}")
    print()
    print("XML Preview (first 500 chars):")
    print("-" * 60)
    print(xml[:500])
    if len(xml) > 500:
        print("...[truncated]")
    print("-" * 60)


if __name__ == '__main__':
    main()
