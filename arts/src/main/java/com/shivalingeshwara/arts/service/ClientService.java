package com.shivalingeshwara.arts.service;

import com.shivalingeshwara.arts.model.Client;
import com.shivalingeshwara.arts.model.ClientOrder;
import com.shivalingeshwara.arts.model.ClientPayment;
import com.shivalingeshwara.arts.repository.ClientOrderRepository;
import com.shivalingeshwara.arts.repository.ClientPaymentRepository;
import com.shivalingeshwara.arts.repository.ClientRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class ClientService {

private final ClientRepository clientRepository;
private final ClientOrderRepository clientOrderRepository;
private final ClientPaymentRepository clientPaymentRepository;

public ClientService(ClientRepository clientRepository,
                     ClientOrderRepository clientOrderRepository,
                     ClientPaymentRepository clientPaymentRepository) {
    this.clientRepository = clientRepository;
    this.clientOrderRepository = clientOrderRepository;
    this.clientPaymentRepository = clientPaymentRepository;
}


    public List<ClientOrder> getOrdersByClient(Long clientId) {
        return clientOrderRepository.findByClientId(clientId);
    }

    // 🔹 Total Billed (Sum of all order prices)
    public double getTotalBilled(Long clientId) {
        Double total = clientOrderRepository.getTotalBilledByClient(clientId);
        return total != null ? total : 0.0;
    }

    public double getTotalReceived(Long clientId) {
        Double total = clientPaymentRepository.getTotalPaidByClient(clientId);
        return total != null ? total : 0.0;
    }

    // 🔹 Total Paid
    public double getTotalPaid(Long clientId) {
        Double total = clientPaymentRepository.getTotalPaidByClient(clientId);
        return total != null ? total : 0.0;
    }

    // 🔹 Outstanding Balance
public double getOutstandingBalance(Long clientId) {

    Client client = clientRepository.findById(clientId).orElseThrow();

    Double balance = client.getTotalBalance();
    if (balance == null) balance = 0.0;

    Double paid = clientPaymentRepository.getTotalPaidByClient(clientId);
    if (paid == null) paid = 0.0;

    return balance - paid;
}


    // 🔹 Total Orders Count
    public long getOrderCount(Long clientId) {
        return clientOrderRepository.countByClientId(clientId);
    }

    public void saveClientPayment(ClientPayment payment) {
    clientPaymentRepository.save(payment);
}

public List<ClientPayment> getClientPayments(Long clientId) {
    return clientPaymentRepository
            .findByClientIdOrderByPaymentDateDesc(clientId);
}

public List<Client> getAllClients() {
    return clientRepository.findAll();
}

public Client getClientById(Long id) {
    return clientRepository.findById(id).orElseThrow();
}

public void addOrderToClient(Long clientId, ClientOrder order) {

    Client client = clientRepository.findById(clientId).orElseThrow();

    order.setClient(client);
    order.setStatus("Pending");

    clientOrderRepository.save(order);

    // 🔥 Update totalBalance
    Double currentBalance = client.getTotalBalance();
    if (currentBalance == null) currentBalance = 0.0;

    client.setTotalBalance(currentBalance + order.getPrice());

    clientRepository.save(client);
}

public void deleteClientOrder(Long orderId) {

    ClientOrder order = clientOrderRepository.findById(orderId)
            .orElseThrow();

    Client client = order.getClient();

    Double price = order.getPrice();
    if (price == null) price = 0.0;

    // 🔥 Deduct from balance
    Double currentBalance = client.getTotalBalance();
    if (currentBalance == null) currentBalance = 0.0;

    client.setTotalBalance(currentBalance - price);

    clientRepository.save(client);

    clientOrderRepository.delete(order);
}

public void updateClientOrder(Long orderId, Map<String, Object> data) {

    ClientOrder order = clientOrderRepository.findById(orderId)
            .orElseThrow();

    Client client = order.getClient();

    Double oldPrice = order.getPrice();
    if (oldPrice == null) oldPrice = 0.0;

    Double newPrice = Double.parseDouble(data.get("price").toString());

    // 🔥 Difference logic
    Double difference = newPrice - oldPrice;

    Double currentBalance = client.getTotalBalance();
    if (currentBalance == null) currentBalance = 0.0;

    client.setTotalBalance(currentBalance + difference);

    // Update order fields
    order.setDescription(data.get("description").toString());
    order.setPrice(newPrice);
    order.setOrderedDate(LocalDate.parse(data.get("orderedDate").toString()));
    order.setDueDate(LocalDate.parse(data.get("dueDate").toString()));

    clientRepository.save(client);
    clientOrderRepository.save(order);
}

public void saveClient(Client client) {
    clientRepository.save(client);
}

public boolean clientHasOrders(Long clientId) {
    return clientOrderRepository.existsByClientId(clientId);
}

public void deleteClient(Long id) {

    // 1️⃣ Delete all client payments
    clientPaymentRepository.deleteAll(
        clientPaymentRepository.findByClientIdOrderByPaymentDateDesc(id)
    );

    // 2️⃣ Delete all client orders
    clientOrderRepository.deleteAll(
        clientOrderRepository.findByClientId(id)
    );

    // 3️⃣ Delete client
    clientRepository.deleteById(id);
}

// ================= CLIENT DASHBOARD =================

// 🔹 Total Clients
public long getTotalClients() {
    return clientRepository.count();
}

// 🔹 Active Clients
public long getActiveClients() {
    return clientRepository.countByActiveTrue();
}

// 🔹 Disabled Clients
public long getDisabledClients() {
    return clientRepository.countByActiveFalse();
}

// 🔹 Clients With Outstanding Balance
public long getClientsWithBalance() {
    return clientRepository.countByTotalBalanceGreaterThan(0.0);
}

// 🔹 Gross Totals
public double getGrossRevenue() {
    Double total = clientPaymentRepository.getTotalPaidByClient(null);
    return total != null ? total : 0.0;
}

public double getGrossPending() {
    Double total = clientOrderRepository.getTotalBilled();
    Double paid = clientPaymentRepository.getTotalPaid();

    double billed = total != null ? total : 0.0;
    double received = paid != null ? paid : 0.0;

    return billed - received;
}

public long getOrderCountAll() {
    return clientOrderRepository.count();
}

public double getTotalPaidAll() {
    Double total = clientPaymentRepository.getTotalPaid();
    return total != null ? total : 0.0;
}

public Map<String, Object> getMonthDashboard(int year, int month) {

    Map<String, Object> map = new HashMap<>();

    LocalDate start = LocalDate.of(year, month, 1);
    LocalDate end = start.withDayOfMonth(start.lengthOfMonth());

    // Orders in month
    List<ClientOrder> orders =
            clientOrderRepository.findByOrderedDateBetween(start, end);

    double totalBilled = orders.stream()
            .mapToDouble(o -> o.getPrice() != null ? o.getPrice() : 0.0)
            .sum();

    long totalOrders = orders.size();

    // Payments in month
    LocalDateTime startDateTime = start.atStartOfDay();
    LocalDateTime endDateTime = end.atTime(23,59,59);

    Double revenue = clientPaymentRepository
            .sumPaymentsBetween(startDateTime, endDateTime);

    double totalRevenue = revenue != null ? revenue : 0.0;

    map.put("orders", totalOrders);
    map.put("revenue", totalRevenue);
    map.put("pending", totalBilled - totalRevenue);

    return map;
}

public Map<String, Object> getYearDashboard(int year) {

    Map<String, Object> map = new HashMap<>();

    LocalDate start = LocalDate.of(year, 1, 1);
    LocalDate end = LocalDate.of(year, 12, 31);

    List<ClientOrder> orders =
            clientOrderRepository.findByOrderedDateBetween(start, end);

    double totalBilled = orders.stream()
            .mapToDouble(o -> o.getPrice() != null ? o.getPrice() : 0.0)
            .sum();

    long totalOrders = orders.size();

    LocalDateTime startDateTime = start.atStartOfDay();
    LocalDateTime endDateTime = end.atTime(23,59,59);

    Double revenue = clientPaymentRepository
            .sumPaymentsBetween(startDateTime, endDateTime);

    double totalRevenue = revenue != null ? revenue : 0.0;

    map.put("orders", totalOrders);
    map.put("revenue", totalRevenue);
    map.put("pending", totalBilled - totalRevenue);

    return map;
}



}
