// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Marketplace {
    enum TransactionStatus { Pending, Completed, Cancelled }
    
    struct Product {
        uint id;
        address seller;
        string name;
        string description;
        uint price;
        uint quantity;
        bool isActive;
    }

    struct Transaction {
        uint productId;
        address buyer;
        address seller;
        uint quantity;
        uint totalPrice;
        uint timestamp;
        TransactionStatus status;
    }

    uint public productCount = 0;
    uint public transactionCount = 0;
    mapping(uint => Product) public products;
    mapping(uint => Transaction) public transactions;
    mapping(address => uint[]) public userTransactions;
    address public owner;
    IERC20 public reuseToken;
    
    event ProductListed(
        uint indexed productId, 
        address indexed seller, 
        string name, 
        uint price, 
        uint quantity,
        uint timestamp
    );
    
    event ProductPurchased(
        uint indexed productId,
        uint indexed transactionId,
        address indexed buyer,
        address seller,
        uint quantity,
        uint totalPrice,
        uint timestamp
    );
    
    event ProductDeactivated(
        uint indexed productId, 
        address indexed seller,
        uint timestamp
    );
    
    event TransactionStatusUpdated(
        uint indexed transactionId,
        uint indexed productId,
        TransactionStatus status,
        uint timestamp
    );

    constructor(address _reuseToken) {
        owner = msg.sender;
        reuseToken = IERC20(_reuseToken);
    }

    function listProduct(
        string memory _name, 
        string memory _description, 
        uint _price, 
        uint _quantity
    ) public {
        require(_price > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be greater than zero");

        productCount++;
        products[productCount] = Product(
            productCount,
            msg.sender,
            _name,
            _description,
            _price,
            _quantity,
            true
        );
        
        emit ProductListed(
            productCount,
            msg.sender,
            _name,
            _price,
            _quantity,
            block.timestamp
        );
    }

    function buyProduct(uint _productId, uint _quantity) public payable {
        Product storage product = products[_productId];
        require(product.isActive, "Product is not available");
        require(_quantity > 0 && _quantity <= product.quantity, "Invalid quantity");
        require(msg.value >= product.price * _quantity, "Insufficient funds");

        // Check if contract has enough REUSE tokens
        uint rewardAmount = _quantity * 10**18;
        require(reuseToken.balanceOf(address(this)) >= rewardAmount, "Insufficient REUSE tokens in contract");

        transactionCount++;
        uint totalPrice = product.price * _quantity;
        
        // Create transaction record
        transactions[transactionCount] = Transaction(
            _productId,
            msg.sender,
            product.seller,
            _quantity,
            totalPrice,
            block.timestamp,
            TransactionStatus.Completed
        );
        
        // Add transaction to buyer's and seller's history
        userTransactions[msg.sender].push(transactionCount);
        userTransactions[product.seller].push(transactionCount);

        // Transfer payment to seller
        payable(product.seller).transfer(msg.value);
        
        // Update product quantity
        product.quantity -= _quantity;
        if (product.quantity == 0) {
            product.isActive = false;
        }

        emit ProductPurchased(
            _productId,
            transactionCount,
            msg.sender,
            product.seller,
            _quantity,
            totalPrice,
            block.timestamp
        );
        
        emit TransactionStatusUpdated(
            transactionCount,
            _productId,
            TransactionStatus.Completed,
            block.timestamp
        );
        
        // Reward buyer with REUSE tokens
        bool success = reuseToken.transfer(msg.sender, rewardAmount);
        require(success, "REUSE token transfer failed");
    }

    function deactivateProduct(uint _productId) public {
        Product storage product = products[_productId];
        require(msg.sender == product.seller || msg.sender == owner, "Only seller or owner can deactivate product");
        require(product.isActive, "Product is already inactive");

        product.isActive = false;
        emit ProductDeactivated(
            _productId,
            msg.sender,
            block.timestamp
        );
    }
    
    function getUserTransactions(address user) public view returns (uint[] memory) {
        return userTransactions[user];
    }
    
    function getTransaction(uint transactionId) public view returns (
        uint productId,
        address buyer,
        address seller,
        uint quantity,
        uint totalPrice,
        uint timestamp,
        TransactionStatus status
    ) {
        Transaction memory txn = transactions[transactionId];
        return (
            txn.productId,
            txn.buyer,
            txn.seller,
            txn.quantity,
            txn.totalPrice,
            txn.timestamp,
            txn.status
        );
    }
}
